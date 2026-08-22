/* ───────────────────────────────────────────────
 *  Service Worker — Web Push
 * ───────────────────────────────────────────────
 *  Recibe pushes de la Edge Function y muestra la notificación,
 *  incluso con la app cerrada (en móvil, iOS requiere PWA instalada).
 */

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (_e) {
    data = { title: "Couples Diary", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "Couples Diary"
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag,
    data: { url: data.url || "/" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
