/**
 * ───────────────────────────────────────────────
 *  Web Push helpers
 * ───────────────────────────────────────────────
 *  Registro del Service Worker + suscripción PushManager.
 *  La clave pública VAPID se lee de VITE_VAPID_PUBLIC_KEY.
 *
 *  Nota: el envío real (background, teléfono cerrado) lo hace la
 *  Edge Function con la clave privada. Acá solo suscribimos y
 *  guardamos la suscripción en Supabase.
 */

import { supabase } from "@/lib/supabase"

export const VAPID_PUBLIC_KEY: string =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? ""

export const pushSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window

/** Convierte la clave VAPID (base64url) a Uint8Array para applicationServerKey. */
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Registra el Service Worker (idempotente). */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> =>
  navigator.serviceWorker.register("/sw.js")

/** Suscribe al PushManager y persiste la suscripción del usuario. */
export const subscribeToPush = async (userId: string): Promise<boolean> => {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // `endpoint` es columna generada → NO se envía; se deriva de subscription.
  const json = sub.toJSON()
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, subscription: json },
      { onConflict: "user_id,endpoint" },
    )
  return !error
}

/** Cancela la suscripción local y la borra de la base. */
export const unsubscribeFromPush = async (userId: string): Promise<void> => {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
}
