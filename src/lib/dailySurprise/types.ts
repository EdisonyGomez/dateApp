/**
 * ───────────────────────────────────────────────
 *  Daily Surprise — dominio
 * ───────────────────────────────────────────────
 *  Contenido diario bilingüe para la pareja. La misma pieza sale para
 *  ambos el mismo día (selección determinista, ver select.ts).
 *  Tipos como unión discriminada por `kind` → cada renderer conoce
 *  exactamente su payload.
 */

/** Texto bilingüe: es (español) / en (inglés). */
export interface Bi {
  es: string
  en: string
}

export type SurpriseKind =
  | "message"
  | "joke"
  | "riddle"
  | "fact"
  | "trivia"
  | "scramble"
  | "language"
  | "image"

/** Fila de contenido curado (tabla daily_content). */
export type DailyContent =
  | { id: string; kind: "message"; payload: { text: Bi; author?: string } }
  | { id: string; kind: "joke"; payload: { setup: Bi; punchline: Bi } }
  | { id: string; kind: "riddle"; payload: { question: Bi; answer: Bi; hint?: Bi } }
  | { id: string; kind: "fact"; payload: { text: Bi } }
  | {
      id: string
      kind: "trivia"
      payload: { question: Bi; options: { es: string[]; en: string[] }; correctIndex: number }
    }
  | { id: string; kind: "scramble"; payload: { word: Bi; hint: Bi } }
  | { id: string; kind: "language"; payload: { es: string; en: string; example: Bi } }
  | { id: string; kind: "image"; payload: { url: string; caption: Bi } }

/** Tipos pasivos: verlos ya cuenta como "completado" (no requieren interacción). */
export const PASSIVE_KINDS: SurpriseKind[] = ["message", "fact", "image"]

export const isPassive = (kind: SurpriseKind): boolean => PASSIVE_KINDS.includes(kind)

/** Estado de la sorpresa de hoy para un usuario (tabla daily_surprise_state). */
export interface SurpriseState {
  id: string
  user_id: string
  surprise_date: string
  content_id: string
  opened_at: string
  completed_at: string | null
  result: Record<string, unknown> | null
}

/** Estado explícito del hook — NUNCA falla en silencio. */
export type SurpriseStatus = "loading" | "ready" | "empty-pool" | "error"

/** Idioma que el usuario está practicando. */
export type LearningLanguage = "en" | "es"
