-- ───────────────────────────────────────────────
--  Calendar powers · Fase 2a — Recurrencia + estilo
-- ───────────────────────────────────────────────
--  Correr DESPUÉS de 20260822_calendar_powers.sql.
--  Supabase → SQL Editor → pegar y Run. Idempotente.

alter table public.shared_plans
  add column if not exists rrule text,        -- regla de recurrencia iCalendar (RFC 5545). null = evento único
  add column if not exists all_day boolean not null default false,
  add column if not exists end_time time,     -- hora de fin dentro del día (opcional)
  add column if not exists color text;        -- color/categoría del evento (hex). null = default
