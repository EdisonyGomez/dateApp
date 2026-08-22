/**
 * ───────────────────────────────────────────────
 *  useNotifications — permiso + entrega local + push
 * ───────────────────────────────────────────────
 *  Centraliza la Notification API. Lo usan:
 *  - las alertas Realtime (pareja agrega un plan)
 *  - el scheduler de recordatorios (app abierta)
 *  - el opt-in de Web Push (background)
 *
 *  Regla de plataforma: en móvil `new Notification()` tira error;
 *  hay que usar registration.showNotification. Por eso probamos SW.
 */

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  pushSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  VAPID_PUBLIC_KEY,
} from "@/lib/notifications/webPush"

type Permission = NotificationPermission | "unsupported"

const initialPermission = (): Permission =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported"

export interface NotifyOptions {
  body?: string
  tag?: string
  icon?: string
}

export function useNotifications() {
  const [permission, setPermission] = useState<Permission>(initialPermission)
  const [pushEnabled, setPushEnabled] = useState(false)

  const supported = permission !== "unsupported"

  // registra el SW temprano (necesario para showNotification en móvil)
  useEffect(() => {
    if (pushSupported()) registerServiceWorker().catch(() => undefined)
  }, [])

  const requestPermission = useCallback(async (): Promise<Permission> => {
    if (!supported) return "unsupported"
    const p = await Notification.requestPermission()
    setPermission(p)
    return p
  }, [supported])

  /** Muestra una notificación; cae a toast si no hay permiso. */
  const notify = useCallback(
    async (title: string, opts: NotifyOptions = {}) => {
      if (supported && Notification.permission === "granted") {
        try {
          const reg = await navigator.serviceWorker?.ready
          if (reg) {
            await reg.showNotification(title, { body: opts.body, tag: opts.tag, icon: opts.icon })
            return
          }
          new Notification(title, { body: opts.body, tag: opts.tag, icon: opts.icon })
          return
        } catch {
          /* fall through al toast */
        }
      }
      toast(title, { description: opts.body })
    },
    [supported],
  )

  /** Opt-in de Web Push: permiso + SW + suscripción guardada en Supabase. */
  const enablePush = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!pushSupported()) {
        toast.error("Push notifications aren't supported on this device")
        return false
      }
      if (!VAPID_PUBLIC_KEY) {
        toast.error("Push isn't configured yet (missing VAPID key)")
        return false
      }
      const p = await requestPermission()
      if (p !== "granted") {
        toast.error("Notification permission denied")
        return false
      }
      const ok = await subscribeToPush(userId)
      setPushEnabled(ok)
      if (ok) toast.success("Push notifications enabled 🎉")
      return ok
    },
    [requestPermission],
  )

  const disablePush = useCallback(async (userId: string) => {
    await unsubscribeFromPush(userId)
    setPushEnabled(false)
    toast("Push notifications disabled")
  }, [])

  return {
    supported,
    permission,
    pushEnabled,
    pushConfigured: pushSupported() && !!VAPID_PUBLIC_KEY,
    requestPermission,
    notify,
    enablePush,
    disablePush,
  }
}
