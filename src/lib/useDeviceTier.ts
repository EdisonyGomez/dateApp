/**
 * ───────────────────────────────────────────────
 *  useDeviceTier — capacidad del dispositivo
 * ───────────────────────────────────────────────
 *  Única fuente de verdad para decidir qué capas visuales corren.
 *  El "wow" no puede romper el mobile: siempre hay degradación.
 *
 *   - 'reduced': el usuario pidió menos movimiento → sin 3D ni scrub.
 *   - 'lite':    dispositivo modesto → reveals sí, WebGL no.
 *   - 'full':    todo (iPhone/Android modernos incluidos).
 */

import { useEffect, useState } from "react"

export type DeviceTier = "full" | "lite" | "reduced"

const REDUCED_MQ = "(prefers-reduced-motion: reduce)"

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("full")

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MQ)

    const compute = (): DeviceTier => {
      if (mq.matches) return "reduced"
      const cores = navigator.hardwareConcurrency ?? 8
      const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
      if (cores < 4 || mem < 4) return "lite"
      return "full"
    }

    setTier(compute())
    const onChange = () => setTier(compute())
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return tier
}
