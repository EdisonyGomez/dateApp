-- ───────────────────────────────────────────────
--  Reminders system · Phase 3
--  Despacho programado + completado por ocurrencia
-- ───────────────────────────────────────────────
--  Supabase → SQL Editor → paste & Run. Idempotent.

-- 1) Timezone del usuario → disparar recordatorios a la hora LOCAL correcta
alter table public.profiles add column if not exists timezone text;

-- 2) Completadas por ocurrencia (tareas recurrentes: un check por día)
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.shared_plans (id) on delete cascade,
  occurrence_date date not null,
  completed_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (plan_id, occurrence_date)
);
alter table public.task_completions enable row level security;

do $$ begin
  create policy "completions readable by authenticated" on public.task_completions
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert own completion" on public.task_completions
    for insert with check (auth.uid() = completed_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "delete own completion" on public.task_completions
    for delete using (auth.uid() = completed_by);
exception when duplicate_object then null; end $$;

-- 3) Log de recordatorios enviados → evitar duplicados (una vez por ocurrencia)
--    Solo la Edge Function (service_role) escribe/lee. RLS on + sin policies = cerrado.
create table if not exists public.reminder_sent (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.shared_plans (id) on delete cascade,
  occurrence_date date not null,
  sent_at timestamptz not null default now(),
  unique (plan_id, occurrence_date)
);
alter table public.reminder_sent enable row level security;
