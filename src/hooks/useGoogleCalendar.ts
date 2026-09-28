/**
 * ───────────────────────────────────────────────
 *  useGoogleCalendar — conexión + sync con Google Calendar
 * ───────────────────────────────────────────────
 *  - status: lee la vista segura `google_calendar_status` (sin tokens).
 *  - connect(): pide un nonce (RPC) y redirige al consent de Google.
 *  - sync(): invoca la Edge Function `google-sync` (push app→Google en Fase 3).
 *  - Al volver del callback (?google=connected) conecta, sincroniza y avisa.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import { buildConsentUrl, isGoogleConfigured } from "@/lib/google/oauth"

export interface GoogleStatus {
  connected: boolean
  email: string | null
  calendarId: string | null
}

interface SyncCounts {
  created: number
  updated: number
  deleted: number
}
interface SyncResult {
  pushed?: SyncCounts
  pulled?: SyncCounts
  errors?: string[]
}

const total = (c?: SyncCounts) => (c ? c.created + c.updated + c.deleted : 0)

interface Options {
  /** se llama tras un sync exitoso (para refrescar los planes en la UI) */
  onSynced?: () => void
}

export function useGoogleCalendar({ onSynced }: Options = {}) {
  const { user } = useAuth()
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const onSyncedRef = useRef(onSynced)
  onSyncedRef.current = onSynced

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from("google_calendar_status")
      .select("connected, email, calendar_id")
      .maybeSingle()
    if (error) console.error("google status error:", error)
    setStatus(
      data
        ? { connected: !!data.connected, email: data.email, calendarId: data.calendar_id }
        : { connected: false, email: null, calendarId: null },
    )
    setLoading(false)
  }, [user])

  const sync = useCallback(
    async (opts: { silent?: boolean } = {}): Promise<SyncResult | null> => {
      if (!user) return null
      setSyncing(true)
      try {
        const { data, error } = await supabase.functions.invoke<SyncResult>("google-sync")
        if (error) throw error
        const r = data ?? {}
        if (!opts.silent) {
          const toGoogle = total(r.pushed)
          const fromGoogle = total(r.pulled)
          toast.success(
            toGoogle + fromGoogle > 0
              ? `Sincronizado · ${toGoogle} enviados, ${fromGoogle} recibidos`
              : "Todo al día con Google Calendar",
          )
        }
        onSyncedRef.current?.()
        return r
      } catch (e) {
        console.error("google sync failed:", e)
        if (!opts.silent) toast.error("Falló la sincronización con Google")
        return null
      } finally {
        setSyncing(false)
      }
    },
    [user],
  )

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // retorno del callback OAuth → toast + limpiar URL + primer sync automático
  const handledReturn = useRef(false)
  useEffect(() => {
    if (handledReturn.current) return
    const params = new URLSearchParams(window.location.search)
    const g = params.get("google")
    if (!g) return
    handledReturn.current = true
    params.delete("google")
    const qs = params.toString()
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""))

    if (g === "connected") {
      toast.success("Google Calendar conectado 💕")
      fetchStatus()
      // primer sync: empuja lo que ya tenés y trae lo que haya en Google
      sync({ silent: true }).then((r) => {
        if (!r) return
        const sent = total(r.pushed)
        if (sent > 0) toast.success(`${sent} eventos enviados a Google Calendar`)
      })
    } else {
      toast.error("No se pudo conectar Google Calendar")
    }
  }, [fetchStatus, sync])

  const connect = useCallback(async () => {
    if (!user) return
    if (!isGoogleConfigured()) {
      toast.error("Falta configurar VITE_GOOGLE_CLIENT_ID")
      return
    }
    setConnecting(true)
    try {
      const returnUrl = window.location.origin + window.location.pathname
      const { data, error } = await supabase.rpc("google_oauth_create_state", {
        p_return_url: returnUrl,
      })
      if (error || !data) throw error ?? new Error("no state")
      window.location.href = buildConsentUrl(data as string)
    } catch (e) {
      console.error("google connect failed:", e)
      toast.error("No se pudo iniciar la conexión con Google")
      setConnecting(false)
    }
  }, [user])

  return { status, loading, connecting, syncing, connect, sync, refetch: fetchStatus }
}
