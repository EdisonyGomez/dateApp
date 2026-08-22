# Web Push setup (Phase 2)

Realtime alerts already work with **no setup** (partner's open app gets a toast +
browser notification). This guide is only for **background push** (phone closed).

## 1. Generate VAPID keys (once)

```bash
npx web-push generate-vapid-keys
```

Copy the **public** and **private** keys.

## 2. Frontend env

Add the public key to your `.env` (and to Vercel env vars):

```
VITE_VAPID_PUBLIC_KEY=<public key>
```

Rebuild/redeploy so the client picks it up.

## 3. Function secrets

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=<public key> \
  VAPID_PRIVATE_KEY=<private key> \
  VAPID_SUBJECT=mailto:you@example.com
```

## 4. Deploy the function

```bash
supabase functions deploy notify-partner --no-verify-jwt
```

## 5. Database Webhook

Dashboard → **Database → Webhooks → Create**:

- Table: `shared_plans`
- Events: `INSERT`
- Type: `HTTP Request` → `POST` to the `notify-partner` function URL
- Header: `Authorization: Bearer <anon or service key>` (per your webhook config)

## 6. Run the SQL migration

Apply `supabase/migrations/20260822_notifications.sql` (subscriptions table +
Realtime publication).

## Notes

- **iOS**: web push only works if the app is **added to the Home Screen** (PWA),
  a restriction from Apple (iOS 16.4+).
- Each browser/device registers its own subscription; dead ones are auto-pruned
  on send (410/404).
