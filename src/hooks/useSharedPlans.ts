/**
 * ───────────────────────────────────────────────
 *  useSharedPlans — capa de datos del calendario
 * ───────────────────────────────────────────────
 *  Aísla todo el acceso a Supabase (fetch / add / remove / toggle).
 *  El componente queda presentacional. En la Fase 2 la suscripción
 *  Realtime se engancha acá sin tocar la UI.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import { excludeOccurrence, endSeriesBefore, isFirstOccurrence } from "@/lib/calendar/recurrence"
import { categoryFromColor, type CategoryId } from "@/lib/calendar/eventCategory"

export interface Plan {
  id: string
  title: string
  description: string
  /** inicio (YYYY-MM-DD) */
  date: string
  /** fin para eventos multi-día (YYYY-MM-DD) o null = un solo día */
  end_date: string | null
  /** hora (HH:MM) o null = todo el día */
  time: string | null
  location?: string
  /** true → tarea con checkbox; false → evento */
  is_task: boolean
  completed: boolean
  /** minutos antes del inicio para recordar; null = sin recordatorio */
  reminder_minutes: number | null
  /** regla de recurrencia iCalendar (RFC 5545); null = evento único */
  rrule: string | null
  /** evento de todo el día */
  all_day: boolean
  /** hora de fin dentro del día (HH:MM) o null */
  end_time: string | null
  /** color/categoría (hex) o null = default */
  color: string | null
  /** id de categoría semántica (couple|personal|work|…). Siempre poblado por normalize(). */
  category: CategoryId
  created_by: string
  created_by_name?: string
  plan_type: "individual" | "together"
  created_at: string
}

/** Datos que llegan del formulario para crear un plan. */
export interface NewPlanInput {
  title: string
  description: string
  date: string
  end_date: string | null
  time: string | null
  location: string
  is_task: boolean
  reminder_minutes: number | null
  rrule: string | null
  all_day: boolean
  end_time: string | null
  color: string | null
  category: CategoryId
  plan_type: "individual" | "together"
}

/** Fila cruda de Supabase (columnas nuevas opcionales hasta correr la migración). */
interface PlanRow {
  id: string
  title: string
  description?: string | null
  date: string
  end_date?: string | null
  time?: string | null
  location?: string | null
  is_task?: boolean | null
  completed?: boolean | null
  reminder_minutes?: number | null
  rrule?: string | null
  all_day?: boolean | null
  end_time?: string | null
  color?: string | null
  category?: string | null
  created_by: string
  plan_type?: "individual" | "together" | null
  created_at: string
  profiles?: { name?: string } | null
}

/** Defaults tolerantes: si la migración aún no corrió, la UI no rompe. */
const normalize = (row: PlanRow): Plan => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  date: row.date,
  end_date: row.end_date ?? null,
  time: row.time ?? null,
  location: row.location ?? "",
  is_task: row.is_task ?? false,
  completed: row.completed ?? false,
  reminder_minutes: row.reminder_minutes ?? null,
  rrule: row.rrule ?? null,
  all_day: row.all_day ?? false,
  end_time: row.end_time ?? null,
  color: row.color ?? null,
  // columna real primero; si la migración aún no corrió, se deriva del color
  category: (row.category as CategoryId | undefined) ?? categoryFromColor(row.color).id,
  created_by: row.created_by,
  created_by_name: row.profiles?.name || "Desconocido",
  plan_type: row.plan_type ?? "individual",
  created_at: row.created_at,
})

export interface UseSharedPlansOptions {
  /** se llama cuando la PAREJA (no vos) inserta un plan vía Realtime */
  onPartnerInsert?: (plan: Plan) => void
}

export function useSharedPlans({ onPartnerInsert }: UseSharedPlansOptions = {}) {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  // completadas por ocurrencia: claves `${plan_id}|${YYYY-MM-DD}`
  const [completions, setCompletions] = useState<Set<string>>(new Set())

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("shared_plans")
      .select(`*, profiles(name)`)
      .order("date", { ascending: true })

    if (!error && data) setPlans(data.map(normalize))
    else if (error) console.error("Error fetching plans:", error)
    setLoading(false)
  }, [])

  const fetchCompletions = useCallback(async () => {
    const { data } = await supabase
      .from("task_completions")
      .select("plan_id, occurrence_date")
    if (data) setCompletions(new Set(data.map((r) => `${r.plan_id}|${r.occurrence_date}`)))
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchCompletions()
  }, [fetchPlans, fetchCompletions])

  /** ¿está completada esta ocurrencia? (recurrentes = por día; únicos = boolean legacy) */
  const isOccurrenceDone = useCallback(
    (plan: Plan, dateKey: string): boolean =>
      plan.rrule ? completions.has(`${plan.id}|${dateKey}`) : plan.completed,
    [completions],
  )

  /** Marca/desmarca la ocurrencia de una tarea (recurrente → task_completions). */
  const toggleOccurrence = useCallback(
    async (plan: Plan, dateKey: string) => {
      if (!user) return
      if (!plan.rrule) {
        // tarea única → boolean legacy
        const next = !plan.completed
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, completed: next } : p)))
        const { error } = await supabase.from("shared_plans").update({ completed: next }).eq("id", plan.id)
        if (error) setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, completed: !next } : p)))
        return
      }
      const key = `${plan.id}|${dateKey}`
      const done = completions.has(key)
      // optimista
      setCompletions((prev) => {
        const s = new Set(prev)
        if (done) s.delete(key)
        else s.add(key)
        return s
      })
      if (done) {
        await supabase.from("task_completions").delete().eq("plan_id", plan.id).eq("occurrence_date", dateKey)
      } else {
        const { error } = await supabase
          .from("task_completions")
          .insert({ plan_id: plan.id, occurrence_date: dateKey, completed_by: user.id })
        if (error) {
          setCompletions((prev) => {
            const s = new Set(prev)
            s.delete(key)
            return s
          })
        }
      }
    },
    [user, completions],
  )

  // callback en ref → el efecto Realtime no se re-suscribe en cada render
  const onPartnerInsertRef = useRef(onPartnerInsert)
  onPartnerInsertRef.current = onPartnerInsert

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel("shared_plans_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shared_plans" },
        (payload) => {
          fetchPlans()
          const row = payload.new as PlanRow
          if (row.created_by !== user.id) onPartnerInsertRef.current?.(normalize(row))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchPlans])

  // guarda la zona horaria del usuario → el despachador dispara a la hora LOCAL
  useEffect(() => {
    if (!user) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return
    supabase
      .from("profiles")
      .update({ timezone: tz })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.error("timezone update failed:", error)
      })
  }, [user])

  const addPlan = useCallback(
    async (input: NewPlanInput): Promise<boolean> => {
      if (!user) {
        toast.error("You must be logged in to create plans")
        return false
      }
      const { data, error } = await supabase
        .from("shared_plans")
        .insert([
          {
            title: input.title,
            description: input.description,
            date: input.date,
            end_date: input.end_date,
            time: input.time,
            location: input.location,
            is_task: input.is_task,
            completed: false,
            reminder_minutes: input.reminder_minutes,
            rrule: input.rrule,
            all_day: input.all_day,
            end_time: input.end_time,
            color: input.color,
            category: input.category,
            plan_type: input.plan_type,
            created_by: user.id,
          },
        ])
        .select("*")
        .single()

      if (error) {
        toast.error("Failed to create")
        console.error("Error creating plan:", error)
        return false
      }

      // Heads-up inmediato a la pareja SOLO para planes (las tareas son personales).
      // El recordatorio programado (a la hora) lo maneja la función dispatch-reminders.
      // Fire-and-forget: no bloquea el guardado si el push falla o no está desplegado.
      if (data && !data.is_task) {
        supabase.functions
          .invoke("notify-partner", { body: { type: "INSERT", record: data } })
          .catch((e) => console.error("notify-partner invoke failed:", e))
      }

      toast.success(input.is_task ? "Task created!" : "Plan created!")
      await fetchPlans()
      return true
    },
    [user, fetchPlans],
  )

  const updatePlan = useCallback(
    async (id: string, input: NewPlanInput): Promise<boolean> => {
      const { error } = await supabase
        .from("shared_plans")
        .update({
          title: input.title,
          description: input.description,
          date: input.date,
          end_date: input.end_date,
          time: input.time,
          location: input.location,
          is_task: input.is_task,
          reminder_minutes: input.reminder_minutes,
          rrule: input.rrule,
          all_day: input.all_day,
          end_time: input.end_time,
          color: input.color,
          category: input.category,
          plan_type: input.plan_type,
        })
        .eq("id", id)

      if (error) {
        toast.error("Failed to save changes")
        console.error("Error updating plan:", error)
        return false
      }
      toast.success("Changes saved!")
      await fetchPlans()
      return true
    },
    [fetchPlans],
  )

  const removePlan = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("shared_plans").delete().eq("id", id)
      if (error) {
        toast.error("Failed to delete")
        return
      }
      toast.success("Deleted")
      setPlans((prev) => prev.filter((p) => p.id !== id))
    },
    [],
  )

  /** Actualiza solo la regla de recurrencia de un plan. */
  const patchRrule = useCallback(
    async (id: string, rrule: string) => {
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, rrule } : p)))
      const { error } = await supabase.from("shared_plans").update({ rrule }).eq("id", id)
      if (error) {
        toast.error("Failed to update series")
        await fetchPlans()
      }
    },
    [fetchPlans],
  )

  /** Borra SOLO esta ocurrencia (EXDATE). Únicos → borra el plan. */
  const deleteOccurrence = useCallback(
    async (plan: Plan, dateKey: string) => {
      if (!plan.rrule) return removePlan(plan.id)
      await patchRrule(plan.id, excludeOccurrence(plan.rrule, dateKey))
      toast.success("Event deleted")
    },
    [patchRrule, removePlan],
  )

  /** Borra esta ocurrencia y todas las SIGUIENTES (UNTIL). Si es la primera → todo. */
  const deleteFutureFrom = useCallback(
    async (plan: Plan, dateKey: string) => {
      if (!plan.rrule) return removePlan(plan.id)
      if (isFirstOccurrence(plan.rrule, dateKey)) return removePlan(plan.id)
      await patchRrule(plan.id, endSeriesBefore(plan.rrule, dateKey))
      toast.success("This and following events deleted")
    },
    [patchRrule, removePlan],
  )

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      // optimista: refleja ya y revierte si falla
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, completed } : p)))
      const { error } = await supabase
        .from("shared_plans")
        .update({ completed })
        .eq("id", id)
      if (error) {
        toast.error("Couldn't update the task")
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, completed: !completed } : p)),
        )
      }
    },
    [],
  )

  return {
    plans,
    loading,
    completions,
    addPlan,
    updatePlan,
    removePlan,
    deleteOccurrence,
    deleteFutureFrom,
    toggleComplete,
    isOccurrenceDone,
    toggleOccurrence,
    refetch: fetchPlans,
    refetchCompletions: fetchCompletions,
  }
}
