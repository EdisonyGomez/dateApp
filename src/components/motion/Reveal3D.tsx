import type React from "react"
import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useDeviceTier } from "@/lib/useDeviceTier"

gsap.registerPlugin(ScrollTrigger)

interface Reveal3DProps {
  children: React.ReactNode
  /** habilita el parallax de profundidad (solo tier full) */
  parallax?: boolean
  className?: string
}

/**
 * Envuelve un elemento para que "aterrice" en 3D al entrar en viewport
 * (rotateX + profundidad + fade) y flote con un parallax sutil mientras
 * está en pantalla. Se apaga solo en tier 'reduced'.
 *
 * Estructura de dos capas para no chocar transforms:
 *   outer → parallax (yPercent scrub)
 *   inner → reveal (opacity + rotateX + y)
 */
export const Reveal3D: React.FC<Reveal3DProps> = ({ children, parallax = true, className }) => {
  const tier = useDeviceTier()
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (tier === "reduced" || !outer.current || !inner.current) return

    const ctx = gsap.context(() => {
      // Reveal 3D al entrar
      gsap.fromTo(
        inner.current,
        { opacity: 0, y: 54, rotateX: 12, transformPerspective: 900, transformOrigin: "50% 100%" },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: outer.current, start: "top 90%", once: true },
        },
      )

      // Parallax de profundidad (solo full)
      if (parallax && tier === "full") {
        gsap.fromTo(
          outer.current,
          { yPercent: 5 },
          {
            yPercent: -5,
            ease: "none",
            scrollTrigger: { trigger: outer.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        )
      }
    }, outer)

    return () => ctx.revert()
  }, [tier, parallax])

  return (
    <div ref={outer} className={className} style={{ willChange: "transform" }}>
      <div ref={inner} style={{ willChange: "transform, opacity" }}>
        {children}
      </div>
    </div>
  )
}
