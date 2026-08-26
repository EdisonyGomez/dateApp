import type React from "react"
import { motion } from "framer-motion"

const COLORS = ["#f43f5e", "#fb7185", "#f59e0b", "#8b5cf6", "#22c55e", "#3b82f6"]

/**
 * Celebración de confetti sin dependencias externas.
 * Se monta cuando `show` es true (dentro de un AnimatePresence del padre
 * o simplemente al completar). Respeta prefers-reduced-motion.
 */
export const Confetti: React.FC<{ count?: number }> = ({ count = 24 }) => {
  const reduce =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  if (reduce) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100
        const size = 6 + Math.random() * 8
        const color = COLORS[i % COLORS.length]
        const delay = Math.random() * 0.15
        const duration = 1.1 + Math.random() * 0.9
        const drift = (Math.random() - 0.5) * 120
        return (
          <motion.span
            key={i}
            className="absolute top-0 rounded-[2px]"
            style={{ left: `${left}%`, width: size, height: size * 1.4, backgroundColor: color }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 420, x: drift, opacity: [0, 1, 1, 0], rotate: Math.random() * 720 - 360 }}
            transition={{ duration, delay, ease: "easeIn" }}
          />
        )
      })}
    </div>
  )
}
