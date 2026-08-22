/**
 * ───────────────────────────────────────────────
 *  useReminderScheduler — recordatorios con app abierta
 * ───────────────────────────────────────────────
 *  Programa notificaciones locales (setTimeout) para los planes con
 *  reminder_minutes cuya alerta cae dentro de las próximas 24h.
 *
 *  Alcance honesto: esto solo dispara mientras la app está abierta.
 *  La entrega en background (teléfono cerrado) la hace la Edge Function
 *  de Web Push. Para eventos recurrentes/all-day, la entrega precisa
 *  queda para el backend; acá cubrimos el caso común (evento con hora).
 */

import { useEffect, useRef } from "react"
import type { Plan } from "@/hooks/useSharedPlans"

const WINDOW_MS = 24 * 60 * 60 * 1000

/** Fecha/hora de inicio local de un plan (null si no aplica scheduling local). */
const startDate = (plan: Plan): Date | null => {
  if (plan.rrule || plan.all_day || !plan.time) return null
  const [y, m, d] = plan.date.split("-").map(Number)
  const [hh, mm] = plan.time.split(":").map(Number)
  if (!y) return null
  return new Date(y, m - 1, d, hh || 0, mm || 0)
}

export function useReminderScheduler(
  plans: Plan[],
  notify: (title: string, opts?: { body?: string; tag?: string }) => void,
) {
  const timers = useRef<number[]>([])
  const fired = useRef<Set<string>>(new Set())

  useEffect(() => {
    // limpia timers previos ante cualquier cambio de la lista
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []

    const now = Date.now()
    for (const plan of plans) {
      if (plan.reminder_minutes === null || plan.completed) continue
      const start = startDate(plan)
      if (!start) continue

      const reminderAt = start.getTime() - plan.reminder_minutes * 60_000
      const delay = reminderAt - now
      const key = `${plan.id}:${reminderAt}`
      if (delay <= 0 || delay > WINDOW_MS || fired.current.has(key)) continue

      const id = window.setTimeout(() => {
        fired.current.add(key)
        notify(plan.is_task ? "Task reminder" : "Event reminder", {
          body: `${plan.title} · ${plan.time}`,
          tag: key,
        })
      }, delay)
      timers.current.push(id)
    }

    return () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current = []
    }
  }, [plans, notify])
}
