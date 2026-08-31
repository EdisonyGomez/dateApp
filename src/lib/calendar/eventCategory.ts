/**
 * ───────────────────────────────────────────────
 *  eventCategory — fuente de verdad de categorías
 * ───────────────────────────────────────────────
 *  El modelo `Plan` NO tiene columna `category`: solo guarda `color` (hex).
 *  Para no tocar el schema ni migrar datos, la categoría es una capa
 *  SEMÁNTICA que vive sobre el color:
 *
 *    - Al crear un evento → se guarda el `color` canónico de la categoría.
 *    - Al leer un evento  → `categoryFromColor(color)` recupera icono/label.
 *
 *  Así los eventos viejos (hex sueltos) siguen funcionando: mapean a la
 *  categoría más cercana y, si no matchean, caen en la default (couple).
 *
 *  Fase 2 podrá agregar una columna `category` real; este módulo seguirá
 *  siendo el único lugar donde se define el set.
 */

import {
  Moon,
  Briefcase,
  Heart,
  Zap,
  Cake,
  Plane,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react"

export type CategoryId =
  | "personal"
  | "work"
  | "couple"
  | "important"
  | "birthday"
  | "trip"
  | "anniversary"

export interface EventCategory {
  id: CategoryId
  /** etiqueta visible */
  label: string
  /** color sólido — se guarda en `Plan.color`. Seguro para texto blanco. */
  color: string
  /** tinte claro para fondos suaves (light mode) */
  soft: string
  /** icono lucide para chips y pickers */
  icon: LucideIcon
  /** emoji equivalente (fallback / superficies sin lucide) */
  emoji: string
}

/** Categoría por defecto: rose = brand = el `DEFAULT_COLOR` histórico (#f43f5e). */
export const DEFAULT_CATEGORY_ID: CategoryId = "couple"

/** Orden canónico para pickers y leyendas. */
export const CATEGORIES: EventCategory[] = [
  { id: "couple",      label: "Couple",      color: "#f43f5e", soft: "#ffe4e6", icon: Heart,          emoji: "💗" },
  { id: "personal",    label: "Personal",    color: "#0ea5e9", soft: "#e0f2fe", icon: Moon,           emoji: "🌙" },
  { id: "work",        label: "Work",        color: "#6366f1", soft: "#e0e7ff", icon: Briefcase,      emoji: "💼" },
  { id: "important",   label: "Important",   color: "#f97316", soft: "#ffedd5", icon: Zap,            emoji: "⚡" },
  { id: "birthday",    label: "Birthday",    color: "#f59e0b", soft: "#fef3c7", icon: Cake,           emoji: "🎂" },
  { id: "trip",        label: "Trip",        color: "#10b981", soft: "#d1fae5", icon: Plane,          emoji: "✈️" },
  { id: "anniversary", label: "Anniversary", color: "#d946ef", soft: "#fae8ff", icon: HeartHandshake, emoji: "💞" },
]

export const CATEGORY_BY_ID: Record<CategoryId, EventCategory> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CategoryId, EventCategory>,
)

/**
 * Mapa hex → categoría. Incluye los colores canónicos nuevos y los 6 colores
 * legacy del picker viejo (`EVENT_COLORS` en PlanForm), para que los eventos
 * ya creados resuelvan a una categoría con sentido.
 */
const COLOR_TO_CATEGORY: Record<string, CategoryId> = {
  // canónicos (categoría → sí misma)
  "#f43f5e": "couple",
  "#0ea5e9": "personal",
  "#6366f1": "work",
  "#f97316": "important",
  "#f59e0b": "birthday",
  "#10b981": "trip",
  "#d946ef": "anniversary",
  // legacy EVENT_COLORS que no coinciden con un canónico
  "#fb7185": "personal", // peach
  "#8b5cf6": "anniversary", // violet
  "#3b82f6": "work", // blue
}

/**
 * Recupera la categoría de un evento a partir de su color guardado.
 * Tolerante: normaliza el hex y cae en la default si no matchea.
 */
export function categoryFromColor(color: string | null | undefined): EventCategory {
  if (color) {
    const key = color.trim().toLowerCase()
    const id = COLOR_TO_CATEGORY[key]
    if (id) return CATEGORY_BY_ID[id]
  }
  return CATEGORY_BY_ID[DEFAULT_CATEGORY_ID]
}
