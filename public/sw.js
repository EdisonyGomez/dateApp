/* ───────────────────────────────────────────────
 *  Service Worker — Web Push + acciones
 * ───────────────────────────────────────────────
 *  Muestra pushes (app cerrada incluida) y soporta el botón
 *  interactivo "✓ Done" de los recordatorios de tareas.
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
    actions: Array.isArray(data.actions) ? data.actions : [],
    data: data.data || { url: data.url || "/" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const d = event.notification.data || {}

  // "✓ Done": abrir la app con el intent de completar esa ocurrencia
  let url = d.url || "/"
  if (event.action === "complete" && d.plan_id && d.date) {
    url = `/?complete=${encodeURIComponent(d.plan_id)}&date=${encodeURIComponent(d.date)}`
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // si hay una ventana abierta, enfocarla y navegar al intent
      for (const client of clients) {
        if ("focus" in client) {
          client.focus()
          if (url !== "/" && "navigate" in client) client.navigate(url).catch(() => undefined)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
