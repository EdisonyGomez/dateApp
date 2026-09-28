-- ───────────────────────────────────────────────
--  Google Calendar sync · Fase 2 — Estados OAuth (anti-CSRF)
-- ───────────────────────────────────────────────
--  El callback OAuth lo invoca Google en el browser SIN sesión Supabase.
--  Para atar el `code` al usuario correcto sin exponer el JWT en la URL,
--  el frontend pide un `nonce` (RPC autenticado) y lo manda como `state`.
--  El callback (service_role) canjea nonce → user_id + return_url y lo borra.
--
--  Aplicar: Supabase → SQL Editor → pegar y Run. Idempotente.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.google_oauth_states (
  nonce text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  return_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);
-- RLS ON + sin policies = solo service_role (el callback). El cliente usa el RPC.
alter table public.google_oauth_states enable row level security;

create index if not exists google_oauth_states_expires_idx
  on public.google_oauth_states (expires_at);

-- El frontend (autenticado) crea un nonce atado a su auth.uid().
create or replace function public.google_oauth_create_state(p_return_url text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_nonce text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  v_nonce := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.google_oauth_states (nonce, user_id, return_url)
    values (v_nonce, auth.uid(), p_return_url);
  -- limpieza best-effort de expirados
  delete from public.google_oauth_states where expires_at < now();
  return v_nonce;
end;
$$;

revoke all on function public.google_oauth_create_state(text) from public, anon;
grant execute on function public.google_oauth_create_state(text) to authenticated;
