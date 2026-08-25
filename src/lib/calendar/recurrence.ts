/**
 * ───────────────────────────────────────────────
 *  Motor de recurrencia (puro)
 * ───────────────────────────────────────────────
 *  Un evento que se repite NO se guarda como N filas: se guarda como
 *  UNA regla (RRULE, iCalendar RFC 5545) y se EXPANDE a ocurrencias
 *  cuando hay que mostrarlas. Esta es la arquitectura que hace potente
 *  a Google Calendar.
 *
 *  Timezone: todo se construye/lee en UTC (Date.UTC + getUTC*) para
 *  evitar el corrimiento de día clásico de rrule.js.
 */

import { RRule, RRuleSet, rrulestr, type Options } from "rrule"
import { addDays, toDateKey } from "@/lib/date"
import type { Plan } from "@/hooks/useSharedPlans"

/* ───────── config de la UI ───────── */

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "weekdays"
  | "custom"

export type RecurrenceUnit = "day" | "week" | "month" | "year"

export interface RecurrenceConfig {
  preset: RecurrencePreset
  /** custom: repetir cada N unidades */
  interval: number
  unit: RecurrenceUnit
  /** custom semanal: días JS getDay (0=Dom .. 6=Sáb) */
  weekdays: number[]
  /** custom: condición de fin */
  end: { mode: "never" | "onDate" | "after"; date: string; count: number }
}

export const defaultRecurrence = (): RecurrenceConfig => ({
  preset: "none",
  interval: 1,
  unit: "week",
  weekdays: [],
  end: { mode: "never", date: "", count: 10 },
})

/* ───────── helpers UTC ───────── */

const utcFromKey = (key: string, endOfDay = false): Date => {
  const [y, m, d] = key.split("-").map(Number)
  return endOfDay
    ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59))
    : new Date(Date.UTC(y, m - 1, d))
}

const keyFromUTC = (d: Date): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`

/** JS getDay (0=Dom..6=Sáb) → constante de rrule. */
const JS_TO_RRULE = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]

/* ───────── build: config → RRULE string ───────── */

export const configToRRule = (
  config: RecurrenceConfig,
  startKey: string,
  time: string | null,
): string | null => {
  if (config.preset === "none") return null

  const [y, m, d] = startKey.split("-").map(Number)
  const [hh, mm] = time ? time.split(":").map(Number) : [0, 0]
  const dtstart = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0))
  const startDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()

  const opts: Partial<Options> = { dtstart, interval: 1 }

  switch (config.preset) {
    case "daily":
      opts.freq = RRule.DAILY
      break
    case "weekly":
      opts.freq = RRule.WEEKLY
      opts.byweekday = [JS_TO_RRULE[startDow]]
      break
    case "monthly":
      opts.freq = RRule.MONTHLY
      break
    case "yearly":
      opts.freq = RRule.YEARLY
      break
    case "weekdays":
      opts.freq = RRule.WEEKLY
      opts.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR]
      break
    case "custom": {
      opts.interval = Math.max(1, config.interval)
      opts.freq =
        config.unit === "day"
          ? RRule.DAILY
          : config.unit === "week"
            ? RRule.WEEKLY
            : config.unit === "month"
              ? RRule.MONTHLY
              : RRule.YEARLY
      if (config.unit === "week" && config.weekdays.length > 0) {
        opts.byweekday = config.weekdays.map((w) => JS_TO_RRULE[w])
      }
      if (config.end.mode === "onDate" && config.end.date) {
        const [ey, em, ed] = config.end.date.split("-").map(Number)
        opts.until = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59))
      } else if (config.end.mode === "after") {
        opts.count = Math.max(1, config.end.count)
      }
      break
    }
  }

  return new RRule(opts).toString()
}

/* ───────── parse: RRULE string → config (para editar) ───────── */

/** rrule weekday (0=MO..6=SU) → JS getDay (0=Dom..6=Sáb). */
const rruleToJsDay = (n: number): number => (n === 6 ? 0 : n + 1)

/** Obtiene la RRule base de una cadena (soporta RRULE simple o RRuleSet con EXDATE). */
const baseRule = (rrule: string): RRule => {
  const set = rrulestr(rrule, { forceset: true }) as RRuleSet
  return set.rrules()[0]
}

export const rruleToConfig = (rrule: string | null): RecurrenceConfig => {
  const def = defaultRecurrence()
  if (!rrule) return def
  try {
    const rule = baseRule(rrule)
    if (!rule) return def
    const o = rule.options
    const interval = o.interval || 1
    const bw: number[] = Array.isArray(o.byweekday) ? o.byweekday : []
    const weekdays = bw.map(rruleToJsDay).sort((a, b) => a - b)

    const end: RecurrenceConfig["end"] = o.until
      ? { mode: "onDate", date: keyFromUTC(o.until), count: 10 }
      : o.count
        ? { mode: "after", date: "", count: o.count }
        : { mode: "never", date: "", count: 10 }

    const simple = !o.until && !o.count && interval === 1
    const unit: RecurrenceUnit =
      o.freq === RRule.DAILY
        ? "day"
        : o.freq === RRule.WEEKLY
          ? "week"
          : o.freq === RRule.MONTHLY
            ? "month"
            : "year"

    if (simple) {
      if (o.freq === RRule.DAILY) return { ...def, preset: "daily" }
      if (o.freq === RRule.MONTHLY) return { ...def, preset: "monthly" }
      if (o.freq === RRule.YEARLY) return { ...def, preset: "yearly" }
      if (o.freq === RRule.WEEKLY) {
        const isWeekdays = weekdays.length === 5 && [1, 2, 3, 4, 5].every((d) => weekdays.includes(d))
        if (isWeekdays) return { ...def, preset: "weekdays" }
        if (weekdays.length <= 1) return { ...def, preset: "weekly" }
      }
    }
    return { preset: "custom", interval, unit, weekdays, end }
  } catch (e) {
    console.error("No se pudo parsear el RRULE:", rrule, e)
    return def
  }
}

/* ───────── edición de la serie (borrado por ocurrencia) ───────── */

/** Fecha/hora exacta (UTC) de la ocurrencia que cae en `dateKey`, o null. */
const occurrenceDate = (rrule: string, dateKey: string): Date | null => {
  try {
    const hits = rrulestr(rrule, { forceset: true }).between(
      utcFromKey(dateKey),
      utcFromKey(dateKey, true),
      true,
    )
    return hits[0] ?? null
  } catch {
    return null
  }
}

/** Excluye UNA ocurrencia (EXDATE) → "borrar solo este evento". */
export const excludeOccurrence = (rrule: string, dateKey: string): string => {
  const occ = occurrenceDate(rrule, dateKey)
  if (!occ) return rrule
  const parsed = rrulestr(rrule, { forceset: true }) as RRuleSet
  const set = new RRuleSet()
  parsed.rrules().forEach((r) => set.rrule(r))
  parsed.exdates().forEach((d) => set.exdate(d))
  set.exdate(occ)
  return set.toString()
}

/** Corta la serie: elimina esta ocurrencia y todas las siguientes (UNTIL). */
export const endSeriesBefore = (rrule: string, dateKey: string): string => {
  const occ = occurrenceDate(rrule, dateKey)
  if (!occ) return rrule
  const parsed = rrulestr(rrule, { forceset: true }) as RRuleSet
  const base = parsed.rrules()[0]
  const opts: Partial<Options> = { ...base.origOptions }
  opts.until = new Date(occ.getTime() - 60_000) // justo antes de esta ocurrencia
  delete opts.count
  const set = new RRuleSet()
  set.rrule(new RRule(opts))
  parsed.exdates().forEach((d) => set.exdate(d))
  return set.toString()
}

/** ¿`dateKey` es la PRIMERA ocurrencia de la serie? (entonces borrar-futuro = borrar todo) */
export const isFirstOccurrence = (rrule: string, dateKey: string): boolean => {
  try {
    const first = rrulestr(rrule, { forceset: true }).all((_, i) => i < 1)[0]
    return first ? keyFromUTC(first) === dateKey : false
  } catch {
    return false
  }
}

/* ───────── ocurrencias ───────── */

export interface Occurrence {
  plan: Plan
  dateKey: string
  recurring: boolean
}

/** Ocurrencias por día dentro de [startKey, endKey] para pintar la grilla. */
export const occurrencesByDay = (
  plans: Plan[],
  startKey: string,
  endKey: string,
): Map<string, Occurrence[]> => {
  const map = new Map<string, Occurrence[]>()
  const push = (key: string, occ: Occurrence) => {
    const arr = map.get(key)
    if (arr) arr.push(occ)
    else map.set(key, [occ])
  }

  for (const plan of plans) {
    if (plan.rrule) {
      try {
        const dates = rrulestr(plan.rrule).between(
          utcFromKey(startKey),
          utcFromKey(endKey, true),
          true,
        )
        for (const d of dates) {
          const key = keyFromUTC(d)
          if (key >= startKey && key <= endKey) {
            push(key, { plan, dateKey: key, recurring: true })
          }
        }
      } catch (e) {
        console.error("RRULE inválido:", plan.rrule, e)
      }
    } else {
      // evento único / multi-día: una entrada por cada día del rango visible
      const s = toDateKey(plan.date)
      const e = plan.end_date ? toDateKey(plan.end_date) : s
      let cur = s < startKey ? startKey : s
      const last = e > endKey ? endKey : e
      while (cur <= last) {
        push(cur, { plan, dateKey: cur, recurring: false })
        cur = addDays(cur, 1)
      }
    }
  }
  return map
}

/** Próxima ocurrencia de cada plan (una por plan) desde `fromKey`, ordenadas. */
export const upcomingOccurrences = (
  plans: Plan[],
  fromKey: string,
  horizonDays = 365,
): Occurrence[] => {
  const horizonKey = addDays(fromKey, horizonDays)
  const out: Occurrence[] = []

  for (const plan of plans) {
    if (plan.rrule) {
      try {
        const next = rrulestr(plan.rrule).after(utcFromKey(fromKey), true)
        if (next) {
          const key = keyFromUTC(next)
          if (key <= horizonKey) out.push({ plan, dateKey: key, recurring: true })
        }
      } catch (e) {
        console.error("RRULE inválido:", plan.rrule, e)
      }
    } else {
      const s = toDateKey(plan.date)
      const e = plan.end_date ? toDateKey(plan.end_date) : s
      if (e >= fromKey) {
        out.push({ plan, dateKey: s < fromKey ? fromKey : s, recurring: false })
      }
    }
  }

  return out.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

/** Human-readable (en) summary of the current config, for the selector. */
export const describeRecurrence = (
  config: RecurrenceConfig,
  startKey: string,
): string => {
  const dowNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const startDow = startKey
    ? new Date(
        Number(startKey.slice(0, 4)),
        Number(startKey.slice(5, 7)) - 1,
        Number(startKey.slice(8, 10)),
      ).getDay()
    : 0

  switch (config.preset) {
    case "none":
      return "Doesn't repeat"
    case "daily":
      return "Every day"
    case "weekly":
      return `Every week on ${dowNames[startDow]}`
    case "monthly":
      return "Every month"
    case "yearly":
      return "Every year"
    case "weekdays":
      return "Every weekday (Mon–Fri)"
    case "custom": {
      const units: Record<RecurrenceUnit, string> = {
        day: "day",
        week: "week",
        month: "month",
        year: "year",
      }
      const n = config.interval
      const unit = units[config.unit]
      const plural = n > 1 ? `${n} ${unit}s` : unit
      let base = `Every ${plural}`
      if (config.unit === "week" && config.weekdays.length > 0) {
        const days = config.weekdays
          .slice()
          .sort()
          .map((w) => dowNames[w].slice(0, 3))
          .join(", ")
        base += ` on ${days}`
      }
      if (config.end.mode === "onDate" && config.end.date) base += `, until ${config.end.date}`
      else if (config.end.mode === "after") base += `, ${config.end.count} times`
      return base
    }
  }
}
