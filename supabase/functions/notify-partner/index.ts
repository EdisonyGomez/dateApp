/**
 * ───────────────────────────────────────────────
 *  Edge Function: notify-partner
 * ───────────────────────────────────────────────
 *  Envía un Web Push a la PAREJA cuando se inserta un plan.
 *  Se dispara con un Database Webhook (INSERT en shared_plans).
 *
 *  Deploy:
 *    supabase functions deploy notify-partner --no-verify-jwt
 *  Secrets (una vez):
 *    supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
 *  Webhook (Dashboard → Database → Webhooks):
 *    Tabla shared_plans · evento INSERT · HTTP POST a esta función.
 */

import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

interface PlanRecord {
  id: string
  title: string
  is_task: boolean
  created_by: string
  all_day: boolean
  time: string | null
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  record: PlanRecord
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
)

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:example@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
)

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload
    if (payload.type !== "INSERT") return new Response("ignored", { status: 200 })

    const plan = payload.record

    // 1) autor + su nombre + su pareja
    const { data: author } = await supabase
      .from("profiles")
      .select("name, partner_id")
      .eq("id", plan.created_by)
      .single()

    const partnerId = author?.partner_id
    if (!partnerId) return new Response("no partner", { status: 200 })

    // 2) suscripciones push de la pareja
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", partnerId)

    if (!subs || subs.length === 0) return new Response("no subscriptions", { status: 200 })

    const authorName = author?.name ?? "Your partner"
    const kind = plan.is_task ? "task" : "plan"
    const when = plan.all_day ? "All day" : plan.time ?? ""
    const notification = JSON.stringify({
      title: `${authorName} added a ${kind} 💕`,
      body: `${plan.title}${when ? ` · ${when}` : ""}`,
      url: "/",
      tag: `plan-${plan.id}`,
    })

    // 3) enviar; limpiar suscripciones muertas (410/404)
    await Promise.all(
      subs.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, notification)
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 410 || status === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", (row.subscription as { endpoint: string }).endpoint)
          }
        }
      }),
    )

    return new Response("sent", { status: 200 })
  } catch (err) {
    console.error("notify-partner error:", err)
    return new Response("error", { status: 500 })
  }
})
