/**
 * ───────────────────────────────────────────────
 *  Dominio de escritura manual (handwriting)
 * ───────────────────────────────────────────────
 *  Capa pura, sin React ni DOM. Modela el dibujo como
 *  VECTORES: un documento de páginas, cada una con trazos.
 *
 *  La tinta NO se guarda como píxeles: se guarda como puntos.
 *  Renderizar es reproducir. Por eso undo/redo, goma y efectos
 *  salen gratis del modelo.
 */

/** Punto del puntero en coordenadas lógicas (CSS px) + presión + tiempo. */
export interface Point {
  x: number
  y: number
  /** presión real (0–1); 0.5 cuando el dispositivo no reporta */
  pressure: number
  /** timestamp (ms), reservado para futuros efectos temporales */
  t: number
}

/**
 * Modo de un trazo:
 * - 'draw'  → tinta (source-over o el blend del pincel)
 * - 'erase' → goma real (destination-out): borra solo lo que toca
 */
export type StrokeMode = 'draw' | 'erase'

/** Identificador de pincel. La config vive en brushes.ts. */
export type BrushType =
  | 'pen'
  | 'fountain'
  | 'marker'
  | 'highlighter'
  | 'pencil'
  | 'neon'

/** Un trazo = una pincelada continua entre pointerdown y pointerup. */
export interface Stroke {
  id: string
  mode: StrokeMode
  brush: BrushType
  /** color de tinta (ignorado si mode === 'erase') */
  color: string
  /** ancho base en px lógicos; el pincel + la velocidad lo modulan */
  size: number
  points: Point[]
}

/** Una página del cuaderno. */
export interface Page {
  id: string
  strokes: Stroke[]
}

/** Dimensiones lógicas del lienzo + densidad de píxeles (retina/móvil). */
export interface CanvasDims {
  width: number
  height: number
  dpr: number
}
