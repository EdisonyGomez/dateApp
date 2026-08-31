-- ───────────────────────────────────────────────
--  Calendar · Categoría de evento (columna real)
-- ───────────────────────────────────────────────
--  Correr DESPUÉS de 20260822_calendar_recurrence.sql.
--  Supabase → SQL Editor → pegar y Run. Idempotente.
--
--  Antes la categoría se INFERÍA del hex `color`. Ahora es una columna
--  propia; `color` sigue guardándose (lo usan las vistas para el rail/pill).
--  Fuente de verdad del set: src/lib/calendar/eventCategory.ts

alter table public.shared_plans
  add column if not exists category text;   -- id de categoría: couple|personal|work|important|birthday|trip|anniversary

-- Backfill: deriva la categoría del color guardado en las filas ya existentes.
-- Solo toca filas sin categoría → re-correr es seguro.
update public.shared_plans
set category = case lower(color)
    when '#f43f5e' then 'couple'
    when '#0ea5e9' then 'personal'
    when '#6366f1' then 'work'
    when '#f97316' then 'important'
    when '#f59e0b' then 'birthday'
    when '#10b981' then 'trip'
    when '#d946ef' then 'anniversary'
    -- colores legacy del picker viejo
    when '#fb7185' then 'personal'
    when '#8b5cf6' then 'anniversary'
    when '#3b82f6' then 'work'
    else 'couple'
  end
where category is null;
