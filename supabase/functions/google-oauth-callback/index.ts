/**
 * ───────────────────────────────────────────────
 *  Edge Function: google-oauth-callback
 * ───────────────────────────────────────────────
 *  Recibe el redirect de Google tras el consent (?code&state).
 *  1) Canjea el `state` (nonce) → user_id + return_url (tabla google_oauth_states).
 *  2) Canjea el `code` → tokens (access + refresh + id_token).
 *  3) Encuentra o crea el calendario dedicado "Couple's Diary".
 *  4) Guarda la cuenta; el refresh_token va a Vault vía RPC.
 *  5) Redirige a la app: ?google=connected | ?google=error
 *
 *  Deploy:
 *    supabase functions deploy google-oauth-callback --no-verify-jwt
 *  Secrets (una vez):
 *    supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
 *  (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.)
 */

import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`

const CALENDAR_NAME = "Couple's Diary"

// allowlist anti open-redirect: solo devolvemos a orígenes conocidos
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://date-app-silk.vercel.app",
])
const DEFAULT_RETURN = "https://date-app-silk.vercel.app"

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

/** Redirige a la app validando el origen contra la allowlist. */
function redirectApp(returnUrl: string | null, status: "connected" | "error"): Response {
  let base = DEFAULT_RETURN
  if (returnUrl) {
    try {
      if (ALLOWED_ORIGINS.has(new URL(returnUrl).origin)) base = returnUrl
    } catch {
      /* returnUrl inválido → default */
    }
  }
  const url = new URL(base)
  url.searchParams.set("google", status)
  return new Response(null, { status: 302, headers: { Location: url.toString() } })
}

/** Decodifica el payload de un JWT (id_token) sin verificar — viene directo de Google por TLS. */
function decodeJwtPayload(jwt: string): { sub?: string; email?: string } {
  try {
    const [, payload] = jwt.split(".")
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

async function exchangeCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    expires_in: number
    refresh_token?: string
    scope: string
    id_token: string
  }>
}

/** Encuentra el calendario "Couple's Diary" o lo crea. Devuelve su id. */
async function findOrCreateCalendar(accessToken: string): Promise<string> {
  const auth = { Authorization: `Bearer ${accessToken}` }

  const listRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner",
    { headers: auth },
  )
  if (listRes.ok) {
    const list = (await listRes.json()) as { items?: { id: string; summary?: string }[] }
    const found = list.items?.find((c) => c.summary === CALENDAR_NAME)
    if (found) return found.id
  }

  const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: CALENDAR_NAME,
      description: "Planes y tareas sincronizados desde Couple's Diary 💕",
    }),
  })
  if (!createRes.ok) throw new Error(`calendar create failed: ${createRes.status} ${await createRes.text()}`)
  const cal = (await createRes.json()) as { id: string }
  return cal.id
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const oauthError = url.searchParams.get("error")

  // 1) canjear el state (nonce) → user + return_url
  let userId: string | null = null
  let returnUrl: string | null = null
  if (state) {
    const { data: st } = await admin
      .from("google_oauth_states")
      .select("user_id, return_url, expires_at")
      .eq("nonce", state)
      .maybeSingle()
    if (st && new Date(st.expires_at) > new Date()) {
      userId = st.user_id
      returnUrl = st.return_url
    }
    // el nonce es de un solo uso
    await admin.from("google_oauth_states").delete().eq("nonce", state)
  }

  if (oauthError) {
    console.error("google consent error:", oauthError)
    return redirectApp(returnUrl, "error")
  }
  if (!code || !userId) {
    console.error("callback sin code o state válido")
    return redirectApp(returnUrl, "error")
  }

  try {
    // 2) code → tokens
    const tokens = await exchangeCode(code)
    const { sub, email } = decodeJwtPayload(tokens.id_token)

    // 3) calendario dedicado
    const calendarId = await findOrCreateCalendar(tokens.access_token)

    // 4) upsert de la cuenta (la fila debe existir antes de guardar el refresh en Vault)
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    const { error: upsertErr } = await admin.from("google_calendar_accounts").upsert(
      {
        user_id: userId,
        google_sub: sub ?? null,
        email: email ?? null,
        access_token: tokens.access_token,
        token_expiry: tokenExpiry,
        calendar_id: calendarId,
        connected: true,
      },
      { onConflict: "user_id" },
    )
    if (upsertErr) throw new Error(`account upsert failed: ${upsertErr.message}`)

    // refresh_token → Vault (solo si Google lo devolvió; con prompt=consent siempre lo hace)
    if (tokens.refresh_token) {
      const { error: rpcErr } = await admin.rpc("google_set_refresh_token", {
        p_user: userId,
        p_token: tokens.refresh_token,
      })
      if (rpcErr) throw new Error(`vault store failed: ${rpcErr.message}`)
    }

    return redirectApp(returnUrl, "connected")
  } catch (err) {
    console.error("google-oauth-callback error:", err)
    return redirectApp(returnUrl, "error")
  }
})
