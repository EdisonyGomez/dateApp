/**
 * ───────────────────────────────────────────────
 *  Selección determinista de la sorpresa del día
 * ───────────────────────────────────────────────
 *  Ningún servidor "asigna" contenido: ambos clientes CALCULAN la
 *  misma pieza con la semilla compartida (coupleKey + fecha). Cero
 *  coordinación, funciona offline, ambos ven lo mismo.
 *
 *  Anti-repetición: barajado determinista por ciclo (Fisher-Yates
 *  sembrado). Cada pieza sale exactamente una vez por ciclo; al
 *  agregar contenido el orden se recalcula solo.
 *
 *  PURO: sin React ni Supabase → testeable en Node.
 */

import { daysBetween } from "@/lib/date"
import type { DailyContent } from "./types"

/** Fecha ancla del ciclo (arbitraria y fija). */
const EPOCH = "2026-01-01"

/** Hash FNV-1a de 32 bits. */
export const hash32 = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** PRNG determinista mulberry32. */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Barajado Fisher-Yates sembrado (no muta el original). */
export const seededShuffle = <T>(items: readonly T[], seed: number): T[] => {
  const out = items.slice()
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Clave estable de la pareja: ambos ids ordenados → ambos derivan lo mismo. */
export const coupleKey = (a: string, b: string | null | undefined): string =>
  [a, b ?? a].sort().join("|")

/**
 * Elige la pieza del día. Determinista para (coupleKey, dateKey).
 * Devuelve null si el pool está vacío.
 */
export const pickForDay = (
  pool: readonly DailyContent[],
  couple: string,
  dateKey: string,
): DailyContent | null => {
  if (pool.length === 0) return null
  const dayIndex = Math.max(0, daysBetween(EPOCH, dateKey))
  const cycle = Math.floor(dayIndex / pool.length)
  const position = dayIndex % pool.length
  const ordered = seededShuffle(pool, hash32(`${couple}|${cycle}`))
  return ordered[position]
}
