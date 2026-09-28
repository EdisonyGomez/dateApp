/**
 * ───────────────────────────────────────────────
 *  _shared/google.ts — mapping Plan ⇄ Google Event + helpers de API
 * ───────────────────────────────────────────────
 *  Usado por las Edge Functions de sync. Deno.
 */

import type { SupabaseClient } from "npm:@supabase/supabase-js@2"

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!

export const CALENDAR_API = "https://www.googleapis.com/calendar/v3"
export const APP_TAG = "couples-diary"

/** Fila de la cuenta Google (columnas relevantes para sync). */
export interface GoogleAccount {
  user_id: string
  access_token: string | null
  token_expiry: string | null
  calendar_id: string | null
  sync_token: string | null
  connected: boolean
}

/** Plan tal como llega de shared_plans (subset usado en el mapping). */
export interface PlanRow {
  id: string
  title: string
  description: string | null
  date: string
  end_date: string | null
  time: string | null
  end_time: string | null
  all_day: boolean | null
  location: string | null
  rrule: string | null
  is_task: boolean | null
  completed: boolean | null
  category: string | null
  updated_at: string
}

/* ───────── tokens ───────── */

/** Devuelve un access_token válido; refresca contra Google si expiró (cache en la fila). */
export async function ensureAccessToken(
  admin: SupabaseClient,
  account: GoogleAccount,
): Promise<string> {
  const now = Date.now()
  if (
    account.access_token &&
    account.token_expiry &&
    new Date(account.token_expiry).getTime() - now > 60_000
  ) {
    return account.access_token
  }

  const { data: refreshToken, error } = await admin.rpc("google_get_refresh_token", {
    p_user: account.user_id,
  })
  if (error || !refreshToken) throw new Error("no refresh token in vault")

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken as string,
    grant_type: "refresh_token",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`)
  const j = (await res.json()) as { access_token: string; expires_in: number }

  await admin
    .from("google_calendar_accounts")
    .update({
      access_token: j.access_token,
      token_expiry: new Date(now + j.expires_in * 1000).toISOString(),
    })
    .eq("user_id", account.user_id)

  return j.access_token
}

/** fetch a la Calendar API con auth. Devuelve la Response cruda (el caller decide). */
export function gapi(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
}

/* ───────── colores: categoría ⇄ colorId de Google (1..11) ───────── */

const CATEGORY_TO_COLOR: Record<string, string> = {
  couple: "4", // Flamingo
  personal: "7", // Peacock
  work: "9", // Blueberry
  important: "6", // Tangerine
  birthday: "5", // Banana
  trip: "10", // Basil
  anniversary: "3", // Grape
  study: "1", // Lavender
  health: "2", // Sage
  sports: "7", // Peacock
  break: "5", // Banana
  volunteer: "4", // Flamingo
}
const COLOR_TO_CATEGORY: Record<string, string> = {
  "1": "study",
  "2": "health",
  "3": "anniversary",
  "4": "couple",
  "5": "birthday",
  "6": "important",
  "7": "personal",
  "9": "work",
  "10": "trip",
}
export const categoryToColorId = (cat: string | null): string => CATEGORY_TO_COLOR[cat ?? "couple"] ?? "4"
export const colorIdToCategory = (colorId: string | null | undefined): string =>
  (colorId && COLOR_TO_CATEGORY[colorId]) || "couple"

/* ───────── helpers de fecha/hora (wall-clock, sin líos de tz) ───────── */

const pad = (n: number) => String(n).padStart(2, "0")

const addOneDay = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + 1))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

const withSeconds = (time: string): string => (time.length === 5 ? `${time}:00` : time)

/** hora + 1h manteniendo wall-clock; si pasa medianoche, avanza el día. */
const plusOneHour = (dateKey: string, time: string): { date: string; time: string } => {
  const [h, m] = time.split(":").map(Number)
  let nh = h + 1
  let nd = dateKey
  if (nh >= 24) {
    nh -= 24
    nd = addOneDay(dateKey)
  }
  return { date: nd, time: `${pad(nh)}:${pad(m)}:00` }
}

/* ───────── recurrencia: rrule (app) ⇄ recurrence[] (Google) ───────── */

/** rrule del app (con DTSTART) → array de Google (solo RRULE/EXDATE/RDATE). */
export function rruleToRecurrence(rrule: string | null): string[] | undefined {
  if (!rrule) return undefined
  const lines = rrule
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(RRULE|EXDATE|RDATE|EXRULE)[:;]/i.test(l))
  return lines.length ? lines : undefined
}

/* ───────── Plan → Google Event ───────── */

export interface GoogleEventBody {
  summary: string
  description?: string
  location?: string
  colorId?: string
  start: { date?: string; dateTime?: string; timeZone?: string }
  end: { date?: string; dateTime?: string; timeZone?: string }
  recurrence?: string[]
  extendedProperties: { private: Record<string, string> }
}

export function planToGoogleEvent(plan: PlanRow, tz: string): GoogleEventBody {
  const isAllDay = !!plan.all_day || !plan.time
  const ev: GoogleEventBody = {
    summary: plan.title || "(sin título)",
    description: plan.description || undefined,
    location: plan.location || undefined,
    colorId: categoryToColorId(plan.category),
    start: {},
    end: {},
    extendedProperties: {
      private: {
        app: APP_TAG,
        planId: plan.id,
        isTask: String(!!plan.is_task),
        category: plan.category ?? "",
        completed: String(!!plan.completed),
      },
    },
  }

  if (isAllDay) {
    ev.start = { date: plan.date }
    // Google: la fecha de fin de un all-day es EXCLUSIVA → +1 día.
    ev.end = { date: addOneDay(plan.end_date || plan.date) }
  } else {
    const time = withSeconds(plan.time as string)
    ev.start = { dateTime: `${plan.date}T${time}`, timeZone: tz }
    if (plan.end_time) {
      ev.end = { dateTime: `${plan.end_date || plan.date}T${withSeconds(plan.end_time)}`, timeZone: tz }
    } else {
      const e = plusOneHour(plan.end_date || plan.date, plan.time as string)
      ev.end = { dateTime: `${e.date}T${e.time}`, timeZone: tz }
    }
  }

  const rec = rruleToRecurrence(plan.rrule)
  if (rec) ev.recurrence = rec
  return ev
}

/* ───────── Google Event → Plan ───────── */

/** hex canónico por categoría (espejo de src/lib/calendar/eventCategory.ts). */
const CATEGORY_HEX: Record<string, string> = {
  couple: "#f43f5e",
  personal: "#0ea5e9",
  work: "#6366f1",
  important: "#f97316",
  birthday: "#f59e0b",
  trip: "#10b981",
  anniversary: "#d946ef",
  study: "#7c3aed",
  health: "#0d9488",
  sports: "#0891b2",
  break: "#ca8a04",
  volunteer: "#db2777",
}

const minusOneDay = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d - 1))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/** Evento de Google (subset usado). */
export interface GoogleEvent {
  id: string
  etag: string
  status?: string
  summary?: string
  description?: string
  location?: string
  colorId?: string
  recurringEventId?: string
  recurrence?: string[]
  start?: { date?: string; dateTime?: string; timeZone?: string }
  end?: { date?: string; dateTime?: string; timeZone?: string }
  extendedProperties?: { private?: Record<string, string> }
}

/** DTSTART para reconstruir el rrule del app desde un evento de Google. */
function buildDtstart(ev: GoogleEvent): string {
  if (ev.start?.date) return `DTSTART;VALUE=DATE:${ev.start.date.replaceAll("-", "")}`
  const dt = ev.start?.dateTime ?? ""
  const d = dt.slice(0, 10).replaceAll("-", "")
  const t = dt.slice(11, 19).replaceAll(":", "")
  return `DTSTART:${d}T${t}`
}

/** recurrence[] de Google → rrule del app (con DTSTART, formato que espera rrulestr). */
export function recurrenceToRrule(ev: GoogleEvent): string | null {
  const lines = (ev.recurrence ?? []).filter((l) => /^(RRULE|EXDATE|RDATE|EXRULE)[:;]/i.test(l))
  if (!lines.length) return null
  return [buildDtstart(ev), ...lines].join("\n")
}

/** Fila para insertar/actualizar en shared_plans a partir de un evento de Google. */
export function googleEventToPlan(
  ev: GoogleEvent,
  userId: string,
): Record<string, unknown> {
  const priv = ev.extendedProperties?.private ?? {}
  const isAllDay = !!ev.start?.date
  const category = priv.category || colorIdToCategory(ev.colorId)

  const plan: Record<string, unknown> = {
    title: ev.summary || "(sin título)",
    description: ev.description ?? "",
    location: ev.location ?? "",
    all_day: isAllDay,
    is_task: priv.isTask === "true",
    completed: priv.completed === "true",
    plan_type: "individual",
    created_by: userId,
    category,
    color: CATEGORY_HEX[category] ?? null,
    rrule: recurrenceToRrule(ev),
  }

  if (isAllDay) {
    const start = ev.start!.date as string
    plan.date = start
    plan.time = null
    plan.end_time = null
    const endExcl = ev.end?.date
    plan.end_date = endExcl && minusOneDay(endExcl) > start ? minusOneDay(endExcl) : null
  } else {
    const s = ev.start!.dateTime as string
    const e = ev.end?.dateTime
    plan.date = s.slice(0, 10)
    plan.time = s.slice(11, 16)
    plan.end_time = e ? e.slice(11, 16) : null
    const endDate = e ? e.slice(0, 10) : (plan.date as string)
    plan.end_date = endDate > (plan.date as string) ? endDate : null
  }

  return plan
}
