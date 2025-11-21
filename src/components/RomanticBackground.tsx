"use client"

import type React from "react"

/**
 * Fondo romántico pastel para todo el dashboard:
 * - Ocupa todo el viewport (fixed)
 * - Degradado suave
 * - Corazones grandes
 * - Brillitos
 */
export const RomanticBackground: React.FC = () => {
  const hearts = [
    { top: "8%", left: "8%", size: "text-5xl", opacity: "opacity-70" },
    { top: "18%", left: "75%", size: "text-6xl", opacity: "opacity-70" },
    { top: "32%", left: "15%", size: "text-4xl", opacity: "opacity-60" },
    { top: "42%", left: "82%", size: "text-5xl", opacity: "opacity-60" },
    { top: "66%", left: "10%", size: "text-5xl", opacity: "opacity-70" },
    { top: "78%", left: "70%", size: "text-6xl", opacity: "opacity-70" },
  ]

  const sparkles = [
    { top: "20%", left: "40%" },
    { top: "30%", left: "60%" },
    { top: "55%", left: "50%" },
    { top: "70%", left: "30%" },
    { top: "15%", left: "55%" },
  ]

  return (
    <div
      className="
        pointer-events-none fixed inset-0 -z-10 overflow-hidden
        bg-gradient-to-br from-pink-100 via-rose-50 to-sky-100
      "
    >
      {/* Blobs difuminados */}
      <div className="absolute -top-40 -left-32 h-80 w-80 bg-pink-200/70 rounded-full blur-3xl" />
      <div className="absolute -top-20 right-[-120px] h-72 w-72 bg-rose-200/70 rounded-full blur-3xl" />
      <div className="absolute bottom-[-160px] left-[-80px] h-80 w-80 bg-fuchsia-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-40px] h-72 w-72 bg-amber-100/80 rounded-full blur-3xl" />

      {/* Neblina suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-pink-50/40 to-rose-50/80" />

      {/* Corazones grandes */}
      {hearts.map((h, idx) => (
        <div
          key={`heart-${idx}`}
          className={`absolute ${h.size} ${h.opacity} drop-shadow-[0_0_18px_rgba(244,114,182,0.45)]`}
          style={{ top: h.top, left: h.left }}
        >
          💖
        </div>
      ))}

      {/* Brillitos */}
      {sparkles.map((s, idx) => (
        <div
          key={`sparkle-${idx}`}
          className="absolute h-2 w-2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.9)] animate-pulse"
          style={{ top: s.top, left: s.left }}
        />
      ))}
    </div>
  )
}
