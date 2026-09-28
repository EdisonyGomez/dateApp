-- ───────────────────────────────────────────────
--  Google Calendar sync · Fase 3 — Motor de sync (push)
-- ───────────────────────────────────────────────
--  Ajustes de esquema para el push app→Google:
--   1) Un link es por (plan, usuario): cada partner sincroniza el calendario
--      compartido a SU propio "Couple's Diary". Relajamos los unique.
--   2) Al borrar un plan, el FK cascada borra su link → perderíamos el
--      google_event_id y no podríamos borrar el evento en Google. Un trigger
--      BEFORE DELETE captura el id en una cola antes de que el cascade actúe.
--
--  Aplicar: Supabase → SQL Editor → pegar y Run. Idempotente.

-- 1) Uniques por (plan, usuario) y (usuario, evento) ────────────────────────
alter table public.google_event_links drop constraint if exists google_event_links_plan_id_key;
alter table public.google_event_links drop constraint if exists google_event_links_google_event_id_key;

do $$ begin
  alter table public.google_event_links
    add constraint google_event_links_plan_user_key unique (plan_id, user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.google_event_links
    add constraint google_event_links_user_gid_key unique (user_id, google_event_id);
exception when duplicate_object then null; end $$;

-- 2) Cola de borrados pendientes (para borrar el evento en Google) ───────────
create table if not exists public.google_pending_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  calendar_id text,
  created_at timestamptz not null default now()
);
-- RLS ON + sin policies = solo service_role (la función de sync).
alter table public.google_pending_deletions enable row level security;

create index if not exists google_pending_deletions_user_idx
  on public.google_pending_deletions (user_id);

-- 3) Trigger: antes de borrar un plan, capturar sus links en la cola ─────────
create or replace function public.google_capture_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.google_pending_deletions (user_id, google_event_id, calendar_id)
  select l.user_id, l.google_event_id, a.calendar_id
  from public.google_event_links l
  join public.google_calendar_accounts a on a.user_id = l.user_id
  where l.plan_id = old.id and l.deleted = false;
  return old;
end;
$$;

do $$ begin
  create trigger shared_plans_capture_google_delete
    before delete on public.shared_plans
    for each row execute function public.google_capture_delete();
exception when duplicate_object then null; end $$;
