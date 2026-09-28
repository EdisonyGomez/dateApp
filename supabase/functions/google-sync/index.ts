/**
 * ───────────────────────────────────────────────
 *  Edge Function: google-sync  (Fase 3+4 — bidireccional)
 * ───────────────────────────────────────────────
 *  PUSH (app→Google): crea/actualiza/borra eventos según los planes.
 *  PULL (Google→app): lista eventos con syncToken incremental y trae a la app
 *                     lo creado/editado/borrado en Google.
 *
 *  Orden: push primero (los cambios locales ganan), luego pull. Anti-echo por
 *  etag (nuestros propios eventos vuelven con el mismo etag → se saltean).
 *
 *  Deploy:
 *    supabase functions deploy google-sync
 *  (verify_jwt=true: lo llama la app autenticada.)
 */

import { createClient } from "npm:@supabase/supabase-js@2"
import {
  ensureAccessToken,
  gapi,
  googleEventToPlan,
  planToGoogleEvent,
  type GoogleAccount,
  type GoogleEvent,
  type PlanRow,
} from "../_shared/google.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const enc = (s: string) => encodeURIComponent(s)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ error: "missing authorization" }, 401)

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: "invalid session" }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  const result = {
    pushed: { created: 0, updated: 0, deleted: 0 },
    pulled: { created: 0, updated: 0, deleted: 0 },
    errors: [] as string[],
  }

  try {
    const { data: account } = await admin
      .from("google_calendar_accounts")
      .select("user_id, access_token, token_expiry, calendar_id, sync_token, connected")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!account || !account.connected || !account.calendar_id) {
      return json({ error: "google not connected" }, 400)
    }

    const token = await ensureAccessToken(admin, account as GoogleAccount)
    const cal = enc(account.calendar_id)

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle()
    const tz = profile?.timezone || "America/Bogota"

    /* ═══════════ PUSH ═══════════ */

    // borrados pendientes → borrar en Google
    const { data: pending } = await admin
      .from("google_pending_deletions")
      .select("id, google_event_id, calendar_id")
      .eq("user_id", user.id)

    for (const del of pending ?? []) {
      try {
        const res = await gapi(
          token,
          `/calendars/${enc(del.calendar_id || account.calendar_id)}/events/${enc(del.google_event_id)}`,
          { method: "DELETE" },
        )
        if (res.ok || res.status === 404 || res.status === 410) result.pushed.deleted++
        else result.errors.push(`delete ${del.google_event_id}: ${res.status}`)
      } catch (e) {
        result.errors.push(`delete ${del.google_event_id}: ${(e as Error).message}`)
      }
      await admin.from("google_pending_deletions").delete().eq("id", del.id)
    }

    // planes (con el cliente del USUARIO → respeta RLS, scope a la pareja)
    const { data: plans, error: plansErr } = await userClient
      .from("shared_plans")
      .select(
        "id, title, description, date, end_date, time, end_time, all_day, location, rrule, is_task, completed, category, updated_at",
      )
    if (plansErr) throw new Error(`read plans: ${plansErr.message}`)

    const { data: links } = await admin
      .from("google_event_links")
      .select("plan_id, google_event_id, last_local_sync")
      .eq("user_id", user.id)
      .eq("deleted", false)
    const linkByPlan = new Map((links ?? []).map((l) => [l.plan_id, l]))

    for (const plan of (plans ?? []) as PlanRow[]) {
      const link = linkByPlan.get(plan.id)
      const body = planToGoogleEvent(plan, tz)
      try {
        if (!link) {
          const res = await gapi(token, `/calendars/${cal}/events`, {
            method: "POST",
            body: JSON.stringify(body),
          })
          if (!res.ok) throw new Error(`create ${res.status} ${await res.text()}`)
          const ev = (await res.json()) as { id: string; etag: string }
          await admin.from("google_event_links").insert({
            plan_id: plan.id,
            user_id: user.id,
            google_event_id: ev.id,
            etag: ev.etag,
            last_local_sync: plan.updated_at,
            last_remote_sync: new Date().toISOString(),
          })
          result.pushed.created++
        } else if (
          !link.last_local_sync ||
          new Date(plan.updated_at).getTime() > new Date(link.last_local_sync).getTime()
        ) {
          const res = await gapi(token, `/calendars/${cal}/events/${enc(link.google_event_id)}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
          if (!res.ok) throw new Error(`patch ${res.status} ${await res.text()}`)
          const ev = (await res.json()) as { etag: string }
          await admin
            .from("google_event_links")
            .update({ etag: ev.etag, last_local_sync: plan.updated_at, last_remote_sync: new Date().toISOString() })
            .eq("plan_id", plan.id)
            .eq("user_id", user.id)
          result.pushed.updated++
        }
      } catch (e) {
        result.errors.push(`plan ${plan.id}: ${(e as Error).message}`)
      }
    }

    /* ═══════════ PULL ═══════════ */

    const { data: gLinks } = await admin
      .from("google_event_links")
      .select("plan_id, google_event_id, etag")
      .eq("user_id", user.id)
      .eq("deleted", false)
    const linkByGid = new Map((gLinks ?? []).map((l) => [l.google_event_id, l]))

    let syncToken: string | null = account.sync_token
    let pageToken: string | undefined
    let newSyncToken: string | null = null
    let done = false

    while (!done) {
      const params = new URLSearchParams()
      if (syncToken) params.set("syncToken", syncToken)
      else {
        params.set("singleEvents", "false")
        params.set("maxResults", "250")
      }
      if (pageToken) params.set("pageToken", pageToken)

      const res = await gapi(token, `/calendars/${cal}/events?${params.toString()}`)

      // syncToken inválido/expirado → full resync
      if (res.status === 410) {
        syncToken = null
        pageToken = undefined
        await admin.from("google_calendar_accounts").update({ sync_token: null }).eq("user_id", user.id)
        continue
      }
      if (!res.ok) {
        result.errors.push(`list ${res.status} ${await res.text()}`)
        break
      }

      const page = (await res.json()) as {
        items?: GoogleEvent[]
        nextPageToken?: string
        nextSyncToken?: string
      }

      for (const ev of page.items ?? []) {
        try {
          // excepciones de ocurrencias recurrentes → por ahora se ignoran
          if (ev.recurringEventId) continue

          const link = linkByGid.get(ev.id)

          // borrado en Google
          if (ev.status === "cancelled") {
            if (link) {
              // borrar el link ANTES del plan → el trigger no re-encola un borrado (evita eco)
              await admin.from("google_event_links").delete().eq("plan_id", link.plan_id).eq("user_id", user.id)
              await admin.from("shared_plans").delete().eq("id", link.plan_id)
              result.pulled.deleted++
            }
            continue
          }

          // nuestro propio evento sin cambios desde el último sync → skip (anti-echo)
          if (link && link.etag && ev.etag === link.etag) continue

          const planData = googleEventToPlan(ev, user.id)

          if (link) {
            const { data: up } = await admin
              .from("shared_plans")
              .update(planData)
              .eq("id", link.plan_id)
              .select("updated_at")
              .single()
            await admin
              .from("google_event_links")
              .update({
                etag: ev.etag,
                last_remote_sync: new Date().toISOString(),
                // marca como ya-empujado para que el próximo push no lo devuelva (anti-echo inverso)
                last_local_sync: up?.updated_at ?? new Date().toISOString(),
              })
              .eq("plan_id", link.plan_id)
              .eq("user_id", user.id)
            result.pulled.updated++
          } else {
            const { data: ins } = await admin
              .from("shared_plans")
              .insert(planData)
              .select("id, updated_at")
              .single()
            if (ins) {
              await admin.from("google_event_links").insert({
                plan_id: ins.id,
                user_id: user.id,
                google_event_id: ev.id,
                etag: ev.etag,
                last_remote_sync: new Date().toISOString(),
                last_local_sync: ins.updated_at,
              })
              linkByGid.set(ev.id, { plan_id: ins.id, google_event_id: ev.id, etag: ev.etag })
              result.pulled.created++
            }
          }
        } catch (e) {
          result.errors.push(`pull ${ev.id}: ${(e as Error).message}`)
        }
      }

      if (page.nextPageToken) {
        pageToken = page.nextPageToken
        continue
      }
      newSyncToken = page.nextSyncToken ?? null
      done = true
    }

    if (newSyncToken) {
      await admin
        .from("google_calendar_accounts")
        .update({ sync_token: newSyncToken })
        .eq("user_id", user.id)
    }

    return json(result)
  } catch (err) {
    console.error("google-sync error:", err)
    return json({ ...result, error: (err as Error).message }, 500)
  }
})
