-- ───────────────────────────────────────────────
--  Calendar powers · Fase 1
--  Multi-día + tareas + recordatorios
-- ───────────────────────────────────────────────
--  Cómo aplicar: Supabase → SQL Editor → pegar y Run.
--  Es idempotente (IF NOT EXISTS): se puede correr sin miedo.

alter table public.shared_plans
  add column if not exists end_date date,                         -- fin de eventos multi-día (null = un solo día)
  add column if not exists is_task boolean not null default false,-- true = tarea con checkbox
  add column if not exists completed boolean not null default false,
  add column if not exists reminder_minutes integer;             -- minutos antes del inicio (null = sin recordatorio)

-- La hora deja de ser obligatoria (eventos "todo el día" y tareas sin hora)
alter table public.shared_plans
  alter column time drop not null;

-- Índice para las consultas por rango de fechas del calendario
create index if not exists shared_plans_date_idx on public.shared_plans (date);
