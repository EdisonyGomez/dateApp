-- ───────────────────────────────────────────────
--  Daily Surprise
-- ───────────────────────────────────────────────
--  Supabase → SQL Editor → paste & Run. Idempotent.
--  Después de esto, correr supabase/seed/daily_surprise_content.sql.

-- 1) Contenido curado, compartido por la pareja (read-only desde la app)
create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null,            -- message|joke|riddle|fact|trivia|scramble|language|image
  payload jsonb not null,        -- forma según kind (ver src/lib/dailySurprise/types.ts)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.daily_content enable row level security;

do $$ begin
  create policy "daily_content readable by authenticated" on public.daily_content
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- 2) Estado por usuario/día (abierto / completado / resultado)
create table if not exists public.daily_surprise_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid references auth.users (id) on delete set null,
  surprise_date date not null,
  content_id uuid not null references public.daily_content (id) on delete cascade,
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  result jsonb,
  unique (user_id, surprise_date)   -- idempotencia por usuario/día
);

create index if not exists daily_surprise_state_date_idx
  on public.daily_surprise_state (surprise_date);

alter table public.daily_surprise_state enable row level security;

-- Cada quien ve su estado Y el de su pareja (gancho emocional "ya lo resolvió ✓")
do $$ begin
  create policy "own or partner surprise state" on public.daily_surprise_state
    for select using (auth.uid() = user_id or auth.uid() = partner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert own surprise state" on public.daily_surprise_state
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "update own surprise state" on public.daily_surprise_state
    for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 3) Idioma que practica cada usuario (él inglés, ella español). Fallback en la app.
alter table public.profiles add column if not exists learning_language text;

-- 4) Migrar mensajes existentes de love_notes → daily_content (tipo 'message')
--    Idempotente: no re-inserta si ya existe ese texto como mensaje.
insert into public.daily_content (kind, payload)
select 'message', jsonb_build_object('text', jsonb_build_object('es', ln.message, 'en', ln.message))
from public.love_notes ln
where ln.message is not null and length(trim(ln.message)) > 0
  and not exists (
    select 1 from public.daily_content dc
    where dc.kind = 'message'
      and dc.payload -> 'text' ->> 'es' = ln.message
  );
