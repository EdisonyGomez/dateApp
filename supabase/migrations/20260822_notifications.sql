-- ───────────────────────────────────────────────
--  Notifications · Phase 2
--  Realtime + Web Push subscriptions
-- ───────────────────────────────────────────────
--  Supabase → SQL Editor → paste & Run. Idempotent.

-- 1) Realtime: emit changes of shared_plans to subscribers
do $$
begin
  alter publication supabase_realtime add table public.shared_plans;
exception
  when duplicate_object then null; -- already added
end $$;

-- 2) Web Push subscriptions (one row per device/browser per user)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription jsonb not null,
  endpoint text generated always as (subscription ->> 'endpoint') stored,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

-- Cada usuario administra solo sus propias suscripciones.
-- (La Edge Function usa service_role y saltea RLS para leer las de la pareja.)
do $$
begin
  create policy "own subs select" on public.push_subscriptions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "own subs insert" on public.push_subscriptions
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "own subs delete" on public.push_subscriptions
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
