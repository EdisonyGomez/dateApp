-- ───────────────────────────────────────────────
--  Google Calendar sync · Fase 1 — Fundaciones DB
-- ───────────────────────────────────────────────
--  Sync BIDIRECCIONAL con Google Calendar (calendario dedicado "Couple's Diary").
--  Esta migración NO necesita el CLIENT_SECRET: solo prepara el esquema.
--
--  Cómo aplicar (elegí una):
--    A) Supabase → SQL Editor → pegar y Run   (workflow del repo)
--    B) pnpm supabase db push                   (aplica migraciones pendientes)
--  Es idempotente (IF NOT EXISTS / guards): se puede correr sin miedo.
--
--  Modelo de seguridad:
--    - El refresh_token NUNCA se guarda en claro. Va a Supabase Vault.
--    - google_calendar_accounts / google_event_links: RLS ON y SIN policies
--      de cliente = solo service_role (Edge Functions) las toca.
--    - El frontend lee estado por vistas seguras (sin tokens).

-- 0) Vault para cifrar secretos por-usuario (refresh tokens)
create extension if not exists supabase_vault with schema vault;

-- ───────────────────────────────────────────────
-- 1) updated_at en shared_plans → necesario para last-write-wins
-- ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.shared_plans
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  create trigger shared_plans_set_updated_at
    before update on public.shared_plans
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ───────────────────────────────────────────────
-- 2) Cuenta de Google vinculada (1 por usuario). Tokens/estado de sync.
--    RLS ON + sin policies = solo service_role. El cliente NUNCA lee esto.
-- ───────────────────────────────────────────────
create table if not exists public.google_calendar_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  google_sub text,                          -- id de la cuenta Google (sub del id_token)
  email text,                               -- email Google (solo display)
  refresh_token_secret_id uuid,             -- id del secreto en Vault (NO el token en claro)
  access_token text,                        -- cache del access token (vida ~1h)
  token_expiry timestamptz,
  calendar_id text,                         -- id del calendario dedicado "Couple's Diary"
  sync_token text,                          -- listado incremental (events.list)
  channel_id text,                          -- watch channel (push de Google)
  resource_id text,
  channel_expiry timestamptz,
  connected boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_calendar_accounts enable row level security;

do $$ begin
  create trigger google_accounts_set_updated_at
    before update on public.google_calendar_accounts
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ───────────────────────────────────────────────
-- 3) Mapping plan ⇄ evento de Google (1:1). Dedup + detección de cambios.
--    RLS ON + sin policies de cliente = solo service_role escribe.
-- ───────────────────────────────────────────────
create table if not exists public.google_event_links (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.shared_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  etag text,
  last_local_sync timestamptz,   -- updated_at del plan la última vez que EMPUJAMOS a Google
  last_remote_sync timestamptz,  -- cuándo TRAJIMOS de Google por última vez
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id),
  unique (google_event_id)
);
alter table public.google_event_links enable row level security;

do $$ begin
  create trigger google_links_set_updated_at
    before update on public.google_event_links
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

create index if not exists google_event_links_plan_idx on public.google_event_links (plan_id);
create index if not exists google_event_links_user_idx on public.google_event_links (user_id);
create index if not exists google_event_links_gid_idx  on public.google_event_links (google_event_id);

-- ───────────────────────────────────────────────
-- 4) Vault helpers — SECURITY DEFINER, solo service_role.
--    Guardan/leen el refresh token cifrado. El token en claro nunca
--    sale de estas funciones ni se guarda en columnas normales.
-- ───────────────────────────────────────────────
create or replace function public.google_set_refresh_token(p_user uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_secret_id uuid;
  v_name text := 'google_refresh_' || p_user::text;
begin
  -- la fila de la cuenta debe existir antes (el callback la hace upsert primero)
  select refresh_token_secret_id into v_secret_id
    from public.google_calendar_accounts
    where user_id = p_user;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_token, v_name, 'Google Calendar refresh token');
    update public.google_calendar_accounts
      set refresh_token_secret_id = v_secret_id
      where user_id = p_user;
  else
    perform vault.update_secret(v_secret_id, p_token);
  end if;
end;
$$;

create or replace function public.google_get_refresh_token(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_token text;
begin
  select ds.decrypted_secret into v_token
  from public.google_calendar_accounts a
  join vault.decrypted_secrets ds on ds.id = a.refresh_token_secret_id
  where a.user_id = p_user;
  return v_token;
end;
$$;

-- Borra el secreto de Vault al desconectar (llamar antes de borrar la fila).
create or replace function public.google_clear_refresh_token(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_secret_id uuid;
begin
  select refresh_token_secret_id into v_secret_id
    from public.google_calendar_accounts
    where user_id = p_user;
  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
    update public.google_calendar_accounts
      set refresh_token_secret_id = null
      where user_id = p_user;
  end if;
end;
$$;

-- Solo las Edge Functions (service_role) pueden invocar los helpers de Vault.
revoke all on function public.google_set_refresh_token(uuid, text)  from public, anon, authenticated;
revoke all on function public.google_get_refresh_token(uuid)        from public, anon, authenticated;
revoke all on function public.google_clear_refresh_token(uuid)      from public, anon, authenticated;
grant execute on function public.google_set_refresh_token(uuid, text)  to service_role;
grant execute on function public.google_get_refresh_token(uuid)        to service_role;
grant execute on function public.google_clear_refresh_token(uuid)      to service_role;

-- ───────────────────────────────────────────────
-- 5) Vistas seguras para el frontend (SIN tokens). Owner-run + filtro auth.uid().
-- ───────────────────────────────────────────────
-- Estado de conexión de la cuenta del usuario logueado.
create or replace view public.google_calendar_status as
select
  user_id,
  email,
  calendar_id,
  connected,
  channel_expiry,
  updated_at
from public.google_calendar_accounts
where user_id = auth.uid();
grant select on public.google_calendar_status to authenticated;

-- Qué planes del usuario están sincronizados (para badges en la UI).
create or replace view public.google_event_sync as
select
  plan_id,
  google_event_id,
  last_local_sync,
  last_remote_sync
from public.google_event_links
where user_id = auth.uid() and deleted = false;
grant select on public.google_event_sync to authenticated;
