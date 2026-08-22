/**
 * ───────────────────────────────────────────────
 *  Registro de pinceles + paleta
 * ───────────────────────────────────────────────
 *  Cada pincel es un preset de perfect-freehand (la forma de la
 *  tinta) más ajustes de composición (opacidad, blend, glow).
 *  Inspirado en la sensación de Apple Pencil / Samsung Notes:
 *  la tinta se afina/engrosa según velocidad y presión.
 */

import type { StrokeOptions } from 'perfect-freehand'
import type { BrushType } from './types'

export interface Brush {
  id: BrushType
  label: string
  /** grosor por defecto (px lógicos) */
  defaultSize: number
  /** rango sugerido para el slider */
  min: number
  max: number
  /** opacidad de la tinta (0–1) */
  opacity: number
  /** blend opcional (p. ej. resaltador) */
  composite?: GlobalCompositeOperation
  /** radio de glow para efecto neón (px) */
  glow?: number
  /** opciones de perfect-freehand (sin size: se inyecta por trazo) */
  options: Omit<StrokeOptions, 'size'>
}

/**
 * Presets. La clave está en `thinning` (cuánto afina con la velocidad),
 * `streamline` (suavizado del trazo) y los `taper` (puntas finas).
 */
export const BRUSHES: Record<BrushType, Brush> = {
  pen: {
    id: 'pen',
    label: 'Bolígrafo',
    defaultSize: 3.5,
    min: 1,
    max: 12,
    opacity: 1,
    options: {
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true },
    },
  },
  fountain: {
    id: 'fountain',
    label: 'Pluma',
    defaultSize: 5,
    min: 2,
    max: 16,
    opacity: 1,
    options: {
      thinning: 0.85,
      smoothing: 0.6,
      streamline: 0.55,
      simulatePressure: true,
      start: { taper: 40, cap: true },
      end: { taper: 40, cap: true },
    },
  },
  marker: {
    id: 'marker',
    label: 'Marcador',
    defaultSize: 8,
    min: 4,
    max: 24,
    opacity: 1,
    options: {
      thinning: 0.1,
      smoothing: 0.4,
      streamline: 0.5,
      simulatePressure: false,
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true },
    },
  },
  highlighter: {
    id: 'highlighter',
    label: 'Resaltador',
    defaultSize: 18,
    min: 10,
    max: 36,
    opacity: 0.35,
    composite: 'multiply',
    options: {
      thinning: 0,
      smoothing: 0.3,
      streamline: 0.4,
      simulatePressure: false,
      start: { taper: 0, cap: false },
      end: { taper: 0, cap: false },
    },
  },
  pencil: {
    id: 'pencil',
    label: 'Lápiz',
    defaultSize: 2.5,
    min: 1,
    max: 8,
    opacity: 0.75,
    options: {
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.45,
      simulatePressure: true,
      start: { taper: 8, cap: true },
      end: { taper: 8, cap: true },
    },
  },
  neon: {
    id: 'neon',
    label: 'Neón',
    defaultSize: 4,
    min: 2,
    max: 12,
    opacity: 0.95,
    glow: 12,
    options: {
      thinning: 0.4,
      smoothing: 0.55,
      streamline: 0.5,
      simulatePressure: true,
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true },
    },
  },
}

export const BRUSH_LIST: Brush[] = Object.values(BRUSHES)

export const getBrush = (id: BrushType): Brush => BRUSHES[id]

/**
 * Paleta amplia: neutros, vivos y pasteles cute.
 * El usuario también puede elegir un color libre (input nativo).
 */
export const PALETTE: string[] = [
  '#111111', '#4b5563', '#9ca3af', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#fda4af', '#fbcfe8', '#ddd6fe', '#bfdbfe',
]
