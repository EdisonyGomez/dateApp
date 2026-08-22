/**
 * ───────────────────────────────────────────────
 *  Motor de render (puro)
 * ───────────────────────────────────────────────
 *  Entra data (trazos), sale render. Sin React.
 *  La tinta se genera con perfect-freehand: dado un conjunto de
 *  puntos + presión, produce el CONTORNO de la pincelada, que se
 *  rellena de una sola vez. Resultado: tinta nítida y suave, sin
 *  grumos ni bordes fantasma (la sensación Apple Pencil).
 */

import { getStroke } from 'perfect-freehand'
import { getBrush } from './brushes'
import type { CanvasDims, Page, Stroke } from './types'

/** Espaciado de los renglones del "papel" (px lógicos). */
export const RULE_SPACING = 32

/** Convierte el contorno de perfect-freehand en un Path2D suavizado. */
function outlineToPath(pts: number[][]): Path2D {
  const path = new Path2D()
  const len = pts.length
  if (len === 0) return path
  path.moveTo(pts[0][0], pts[0][1])
  for (let i = 0; i < len; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % len]
    // curva cuadrática hacia el punto medio → contorno sedoso
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  path.closePath()
  return path
}

/** Genera el Path2D de un trazo aplicando su pincel. */
export function strokeToPath(stroke: Stroke): Path2D {
  const brush = getBrush(stroke.brush)
  const input = stroke.points.map((p) => [p.x, p.y, p.pressure])
  const outline = getStroke(input, { ...brush.options, size: stroke.size })
  return outlineToPath(outline)
}

/** Pinta un trazo en el contexto, con su blend / opacidad / glow. */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length === 0) return
  const brush = getBrush(stroke.brush)
  const path = strokeToPath(stroke)

  ctx.save()
  if (stroke.mode === 'erase') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000'
  } else {
    ctx.globalCompositeOperation = brush.composite ?? 'source-over'
    ctx.globalAlpha = brush.opacity
    if (brush.glow) {
      ctx.shadowBlur = brush.glow
      ctx.shadowColor = stroke.color
    }
    ctx.fillStyle = stroke.color
  }
  ctx.fill(path)
  ctx.restore()
}

/** Prepara el backing store del canvas para la densidad de píxeles. */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  dims: CanvasDims,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  canvas.width = Math.round(dims.width * dims.dpr)
  canvas.height = Math.round(dims.height * dims.dpr)
  canvas.style.height = `${dims.height}px`
  ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0)
  return ctx
}

/** Limpia el lienzo de tinta (transparente: deja ver el papel debajo). */
export function clearInk(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

/** Re-render completo de una página: limpia y reproduce sus trazos. */
export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
): void {
  clearInk(ctx)
  for (const stroke of strokes) drawStroke(ctx, stroke)
}

/**
 * Blit device-pixel exacto de una capa cacheada sobre otra.
 * Se usa en vivo: la caché (trazos ya hechos) + el trazo actual.
 */
export function blit(
  ctx: CanvasRenderingContext2D,
  cache: HTMLCanvasElement,
): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.drawImage(cache, 0, 0)
  ctx.restore()
}

/** Crea una capa offscreen con la tinta de unos trazos (huecos de goma incluidos). */
export function createInkCanvas(
  strokes: Stroke[],
  dims: CanvasDims,
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.round(dims.width * dims.dpr)
  c.height = Math.round(dims.height * dims.dpr)
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0)
    for (const stroke of strokes) drawStroke(ctx, stroke)
  }
  return c
}

/** ¿La página tiene al menos un trazo de tinta? */
export function pageHasInk(strokes: Stroke[]): boolean {
  return strokes.some((s) => s.mode === 'draw' && s.points.length > 0)
}

/** ¿El documento tiene tinta en alguna página? */
export function documentHasInk(pages: Page[]): boolean {
  return pages.some((p) => pageHasInk(p.strokes))
}

/** Dibuja papel blanco con renglones tenues en un tramo vertical. */
function drawPaper(
  ctx: CanvasRenderingContext2D,
  dims: CanvasDims,
  offsetY: number,
): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, offsetY, dims.width, dims.height)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  for (let y = RULE_SPACING; y < dims.height; y += RULE_SPACING) {
    ctx.beginPath()
    ctx.moveTo(0, offsetY + y)
    ctx.lineTo(dims.width, offsetY + y)
    ctx.stroke()
  }
}

/**
 * Exporta el documento como UN PNG apilando las páginas con tinta.
 * Se descartan páginas vacías finales. Cada página: papel + renglones
 * + su capa de tinta (con los huecos de la goma ya aplicados).
 */
export function exportDocumentToDataURL(
  pages: Page[],
  dims: CanvasDims,
): string {
  // último índice con tinta → recortar páginas vacías al final
  let lastInked = -1
  pages.forEach((p, i) => {
    if (pageHasInk(p.strokes)) lastInked = i
  })
  if (lastInked < 0) return ''
  const used = pages.slice(0, lastInked + 1)

  const out = document.createElement('canvas')
  out.width = Math.round(dims.width * dims.dpr)
  out.height = Math.round(dims.height * used.length * dims.dpr)
  const ctx = out.getContext('2d')
  if (!ctx) return ''
  ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0)

  used.forEach((page, i) => {
    const offsetY = i * dims.height
    drawPaper(ctx, dims, offsetY)
    const ink = createInkCanvas(page.strokes, dims)
    ctx.drawImage(ink, 0, offsetY, dims.width, dims.height)
  })

  return out.toDataURL('image/png')
}
