/**
 * ───────────────────────────────────────────────
 *  Edge Function: dispatch-reminders
 * ───────────────────────────────────────────────
 *  Corre CADA MINUTO (pg_cron). Para cada plan con recordatorio:
 *   - expande la recurrencia (rrule) para hoy/mañana en la zona del creador
 *   - si el minuto de disparo == ahora (hora local), envía Web Push
 *   - Plan → creador + pareja · Tarea → solo creador
 *   - dedupe por (plan, ocurrencia) vía reminder_sent
 *   - tareas: incluye acción "✓ Done" (completado por ocurrencia)
 *
 *  Deploy:
 *    supabase functions deploy dispatch-reminders --no-verify-jwt
 *  Programar (pg_cron, cada minuto) — ver README.
 */

import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"
import { rrulestr } from "npm:rrule@2.8.1"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
)

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:example@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
)

const DEFAULT_MINUTES = 9 * 60 // all-day / sin hora → 9am local

/* ───────── helpers de fecha ───────── */
const pad = (n: number) => String(n).padStart(2, "0")
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const addDays = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return keyOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}
const toDateKey = (v: string): string => {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ""
}
const utcFromKey = (key: string, endOfDay = false): Date => {
  const [y, m, d] = key.split("-").map(Number)
  return endOfDay
    ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59))
    : new Date(Date.UTC(y, m - 1, d))
}

/** Fecha/minuto "ahora" en una zona horaria dada. */
const nowInTz = (tz: string): { dateKey: string; minutes: number } => {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "0"
  let hour = Number(g("hour"))
  if (hour === 24) hour = 0
  return { dateKey: `${g("year")}-${g("month")}-${g("day")}`, minutes: hour * 60 + Number(g("minute")) }
}

interface Plan {
  id: string
  title: string
  is_task: boolean
  date: string
  time: string | null
  all_day: boolean
  rrule: string | null
  reminder_minutes: number | null
  created_by: string
}

/** Ocurrencias (fecha + minuto del día) de un plan para un set de fechas candidatas. */
const occurrencesFor = (plan: Plan, dateKeys: string[]): { date: string; min: number }[] => {
  const out: { date: string; min: number }[] = []
  const timeMin = plan.time ? Number(plan.time.slice(0, 2)) * 60 + Number(plan.time.slice(3, 5)) : DEFAULT_MINUTES

  if (plan.rrule) {
    try {
      const rule = rrulestr(plan.rrule)
      for (const dk of dateKeys) {
        const hits = rule.between(utcFromKey(dk), utcFromKey(dk, true), true)
        if (hits.length > 0) {
          const h = hits[0]
          out.push({ date: dk, min: h.getUTCHours() * 60 + h.getUTCMinutes() })
        }
      }
    } catch (_e) {
      /* rrule inválido → ignora */
    }
  } else {
    const dk = toDateKey(plan.date)
    if (dateKeys.includes(dk)) out.push({ date: dk, min: timeMin })
  }
  return out
}

Deno.serve(async () => {
  try {
    const { data: plans } = await supabase
      .from("shared_plans")
      .select("id, title, is_task, date, time, all_day, rrule, reminder_minutes, created_by")
      .not("reminder_minutes", "is", null)

    if (!plans || plans.length === 0) return new Response("no plans", { status: 200 })

    // perfiles (timezone + pareja) de los creadores
    const creatorIds = [...new Set(plans.map((p) => p.created_by))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, timezone, partner_id")
      .in("id", creatorIds)
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

    let sent = 0

    for (const plan of plans as Plan[]) {
      const creator = profileById.get(plan.created_by)
      const tz = creator?.timezone || "UTC"
      const { dateKey: today, minutes: nowMin } = nowInTz(tz)

      // candidatos: ocurrencias de ayer/hoy/mañana (cubre offsets que cruzan medianoche)
      const candidates = occurrencesFor(plan, [addDays(today, -1), today, addDays(today, 1)])

      for (const occ of candidates) {
        // minuto absoluto de disparo (puede caer el día anterior por el offset)
        let fireDate = occ.date
        let fireMin = occ.min - (plan.reminder_minutes ?? 0)
        if (fireMin < 0) {
          fireDate = addDays(occ.date, -1)
          fireMin += 1440
        } else if (fireMin >= 1440) {
          fireDate = addDays(occ.date, 1)
          fireMin -= 1440
        }
        if (fireDate !== today || fireMin !== nowMin) continue

        // dedupe por ocurrencia
        const { error: dupErr } = await supabase
          .from("reminder_sent")
          .insert({ plan_id: plan.id, occurrence_date: occ.date })
        if (dupErr) continue // ya enviado (unique) → saltar

        // destinatarios
        const recipients = plan.is_task
          ? [plan.created_by]
          : [plan.created_by, creator?.partner_id].filter(Boolean) as string[]

        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("subscription")
          .in("user_id", recipients)

        if (!subs || subs.length === 0) continue

        const timeLabel = plan.all_day ? "" : plan.time ?? ""
        const payload = JSON.stringify({
          title: `⏰ ${plan.title}`,
          body: plan.is_task
            ? "Time for your task"
            : `Reminder${timeLabel ? ` · ${timeLabel}` : ""}`,
          tag: `rem-${plan.id}-${occ.date}`,
          url: "/",
          actions: plan.is_task ? [{ action: "complete", title: "✓ Done" }] : [],
          data: { plan_id: plan.id, date: occ.date, is_task: plan.is_task },
        })

        await Promise.all(
          subs.map(async (row) => {
            try {
              await webpush.sendNotification(row.subscription, payload)
              sent++
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
      }
    }

    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    console.error("dispatch-reminders error:", err)
    return new Response("error", { status: 500 })
  }
})
