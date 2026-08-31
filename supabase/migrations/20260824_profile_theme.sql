-- ───────────────────────────────────────────────
--  Profiles: tema visual por persona (China / Colombia / …)
-- ───────────────────────────────────────────────
--  Supabase → SQL Editor → Run. Idempotente.

alter table public.profiles add column if not exists profile_theme text;
