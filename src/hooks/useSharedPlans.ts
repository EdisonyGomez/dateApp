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

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

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

      // Push a la pareja (background) invocando la Edge Function directamente.
      // Reemplaza al Database Webhook → evita depender del schema supabase_functions.
      // Fire-and-forget: no bloquea el guardado si el push falla o no está desplegado.
      if (data) {
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

  return { plans, loading, addPlan, updatePlan, removePlan, toggleComplete, refetch: fetchPlans }
}
