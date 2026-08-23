# Scheduled reminders (Phase 3)

Delivers reminders **at the configured time** (even with the app closed),
expands recurring tasks (e.g. workout every day 8pm), and routes recipients:
**plan → creator + partner**, **task → creator only**. Task reminders include a
`✓ Done` action to complete that day's occurrence.

Uses the **same VAPID secrets** as `notify-partner` (already set) — no new keys.

## 1. Run the SQL migration

Apply `supabase/migrations/20260822_reminders_system.sql`
(`profiles.timezone`, `task_completions`, `reminder_sent`).

## 2. Deploy the function

```bash
supabase functions deploy dispatch-reminders --no-verify-jwt
```

## 3. Schedule it every minute (pg_cron)

Enable the extensions once: Dashboard → **Database → Extensions** → enable
`pg_cron` and `pg_net`. Then in the **SQL Editor**:

```sql
select cron.schedule(
  'dispatch-reminders',
  '* * * * *',  -- every minute
  $$
    select net.http_post(
      url    := 'https://<PROJECT_REF>.supabase.co/functions/v1/dispatch-reminders',
      headers:= jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer <SERVICE_ROLE_OR_ANON_KEY>'
      ),
      body   := '{}'::jsonb
    );
  $$
);
```

> Prefer no SQL? Supabase **Integrations → Cron** can schedule the same
> HTTP POST / Edge Function invocation from the UI.

To inspect or remove the job:

```sql
select * from cron.job;
select cron.unschedule('dispatch-reminders');
```

## How it works

- Every minute the function reads plans with a reminder, gets each creator's
  `timezone`, and computes the local fire time of each occurrence
  (recurring rules expanded with `rrule`).
- If the fire minute == now (local), it sends the push and writes a row to
  `reminder_sent` (unique per `plan_id + occurrence_date`) so it never repeats.

## Notes / limits

- **Timezone** comes from `profiles.timezone`, which the app saves automatically
  on load. New devices update it themselves.
- **All-day events** with a reminder fire at **09:00 local** by default (there's
  no specific time to offset from). Absolute-time reminders for all-day events
  are a small future add.
- **iOS**: background delivery only for the installed PWA (Add to Home Screen).
  Notification **action buttons** are Android/desktop; on iOS the tap opens the
  app and marks the task done.
