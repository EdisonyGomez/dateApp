/**
 * ───────────────────────────────────────────────
 *  useDailySurprise — capa de datos de la sorpresa diaria
 * ───────────────────────────────────────────────
 *  Resuelve la pieza del día (misma para ambos), maneja el estado
 *  por usuario (abierto/completado) y expone acciones para el modal.
 *
 *  Diseño anti-fallo-silencioso (el error del sistema viejo): status
 *  es explícito ('loading'|'ready'|'empty-pool'|'error'); jamás
 *  devolvemos null en silencio ante un problema.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import { todayKey } from "@/lib/date"
import { coupleKey, pickForDay } from "@/lib/dailySurprise/select"
import {
  isPassive,
  type DailyContent,
  type LearningLanguage,
  type SurpriseState,
  type SurpriseStatus,
} from "@/lib/dailySurprise/types"

export function useDailySurprise() {
  const { user, partner, profile } = useAuth()

  const [status, setStatus] = useState<SurpriseStatus>("loading")
  const [content, setContent] = useState<DailyContent | null>(null)
  const [state, setState] = useState<SurpriseState | null>(null)
  const [partnerState, setPartnerState] = useState<SurpriseState | null>(null)
  const [open, setOpen] = useState(false)
  const [localLang, setLocalLang] = useState<LearningLanguage | null>(null)

  const autoOpenedRef = useRef<string | null>(null) // dateKey ya auto-abierto

  const load = useCallback(async () => {
    if (!user) {
      setStatus("loading")
      return
    }
    setStatus("loading")
    const today = todayKey()

    // 1) pool de contenido activo
    const { data: pool, error: poolErr } = await supabase
      .from("daily_content")
      .select("id, kind, payload")
      .eq("active", true)

    if (poolErr) {
      console.error("daily_content error:", poolErr)
      toast.error("No se pudo cargar la sorpresa del día")
      setStatus("error")
      return
    }
    if (!pool || pool.length === 0) {
      console.warn("daily_content vacío — sin contenido activo")
      setStatus("empty-pool")
      return
    }

    // 2) pieza determinista del día (misma para ambos)
    const pick = pickForDay(pool as DailyContent[], coupleKey(user.id, partner?.id), today)
    if (!pick) {
      setStatus("empty-pool")
      return
    }
    if (import.meta.env.DEV) {
      console.debug("[dailySurprise]", { today, poolSize: pool.length, pickedId: pick.id, kind: pick.kind })
    }
    setContent(pick)

    // 3) mi estado + el de la pareja (RLS permite ver ambos)
    const { data: mine } = await supabase
      .from("daily_surprise_state")
      .select("*")
      .eq("user_id", user.id)
      .eq("surprise_date", today)
      .maybeSingle()
    setState((mine as SurpriseState) ?? null)

    if (partner?.id) {
      const { data: theirs } = await supabase
        .from("daily_surprise_state")
        .select("*")
        .eq("user_id", partner.id)
        .eq("surprise_date", today)
        .maybeSingle()
      setPartnerState((theirs as SurpriseState) ?? null)
    }

    setStatus("ready")

    // 4) auto-abrir una vez por día si aún no hay estado
    if (!mine && autoOpenedRef.current !== today) {
      autoOpenedRef.current = today
      setOpen(true)
      const now = new Date().toISOString()
      const row = {
        user_id: user.id,
        partner_id: partner?.id ?? null,
        surprise_date: today,
        content_id: pick.id,
        opened_at: now,
        // pasivo (mensaje/dato/imagen): verlo ya cuenta como completado
        completed_at: isPassive(pick.kind) ? now : null,
      }
      const { data: inserted, error: insErr } = await supabase
        .from("daily_surprise_state")
        .upsert(row, { onConflict: "user_id,surprise_date", ignoreDuplicates: true })
        .select("*")
        .maybeSingle()
      if (insErr) console.error("surprise state insert error:", insErr)
      if (inserted) setState(inserted as SurpriseState)
    }
  }, [user, partner?.id])

  useEffect(() => {
    load()
  }, [load])

  // reset a medianoche sin recargar la página
  useEffect(() => {
    let day = todayKey()
    const id = window.setInterval(() => {
      const t = todayKey()
      if (t !== day) {
        day = t
        autoOpenedRef.current = null
        load()
      }
    }, 60_000)
    return () => window.clearInterval(id)
  }, [load])

  /** Marca la sorpresa de hoy como completada (guarda resultado opcional). */
  const complete = useCallback(
    async (result?: Record<string, unknown>) => {
      if (!user || !content) return
      const today = todayKey()
      const now = new Date().toISOString()
      const row = {
        user_id: user.id,
        partner_id: partner?.id ?? null,
        surprise_date: today,
        content_id: content.id,
        opened_at: state?.opened_at ?? now,
        completed_at: now,
        result: result ?? null,
      }
      const { data, error } = await supabase
        .from("daily_surprise_state")
        .upsert(row, { onConflict: "user_id,surprise_date" })
        .select("*")
        .maybeSingle()
      if (error) {
        console.error("complete error:", error)
        toast.error("No se pudo guardar tu resultado")
        return
      }
      if (data) setState(data as SurpriseState)
    },
    [user, partner?.id, content, state?.opened_at],
  )

  // idioma que practica el usuario (con override local para no refetchear el perfil)
  const learningLanguage: LearningLanguage | null =
    localLang ?? ((profile as { learning_language?: LearningLanguage } | null)?.learning_language ?? null)

  const setLearningLanguage = useCallback(
    async (lang: LearningLanguage) => {
      setLocalLang(lang)
      if (!user) return
      const { error } = await supabase.from("profiles").update({ learning_language: lang }).eq("id", user.id)
      if (error) console.error("learning_language update error:", error)
    },
    [user],
  )

  return {
    status,
    content,
    open,
    setOpen,
    completed: !!state?.completed_at,
    state,
    partnerState,
    complete,
    learningLanguage,
    setLearningLanguage,
    reload: load,
  }
}
