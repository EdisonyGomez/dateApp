import type React from "react"
import { useDeviceTier } from "@/lib/useDeviceTier"

/**
 * ───────────────────────────────────────────────
 *  AmbientCanvas — fondo ambiental del calendario
 * ───────────────────────────────────────────────
 *  Reemplaza al viejo ParticleBackground (que hacía Math.random() EN RENDER
 *  → los nodos saltaban en cada re-render, y no respetaba reduced-motion).
 *
 *  Acá:
 *   - Posiciones FIJAS (nada de random).
 *   - Blobs difuminados GPU-friendly (blur + transform), sin repaint por nodo.
 *   - El drift solo corre en tier "full"; en lite/reduced queda estático.
 *   - CSS igual mata la animación bajo prefers-reduced-motion (doble red).
 */

const BLOBS = [
  { className: "bg-rose-300/30",    style: { top: "-18%", left: "-8%",  width: "22rem", height: "22rem" }, delay: "0s" },
  { className: "bg-fuchsia-300/25", style: { top: "22%",  right: "-12%", width: "20rem", height: "20rem" }, delay: "-6s" },
  { className: "bg-amber-200/30",   style: { bottom: "-20%", left: "18%", width: "20rem", height: "20rem" }, delay: "-11s" },
  { className: "bg-sky-200/25",     style: { bottom: "6%", right: "22%",  width: "16rem", height: "16rem" }, delay: "-3s" },
]

export const AmbientCanvas: React.FC = () => {
  const tier = useDeviceTier()
  const animate = tier === "full"

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-full blur-3xl ${b.className} ${animate ? "animate-cal-drift" : ""}`}
          style={{ ...b.style, animationDelay: b.delay }}
        />
      ))}
    </div>
  )
}
