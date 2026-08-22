/**
 * ───────────────────────────────────────────────
 *  useHandwriting — capa de estado + comandos
 * ───────────────────────────────────────────────
 *  Orquesta el motor puro con React. Patrón Command/Memento
 *  (useReducer) sobre TODO el documento: dibujar, borrar, limpiar,
 *  agregar/quitar página → cada acción es un comando en la historia,
 *  así undo/redo es uniforme.
 *
 *  Performance: capa de caché offscreen con los trazos ya hechos +
 *  capa viva con el trazo actual → 60fps aunque la página esté llena.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  blit,
  createInkCanvas,
  documentHasInk,
  drawStroke,
  exportDocumentToDataURL,
  setupCanvas,
} from '@/lib/handwriting/engine'
import { getBrush } from '@/lib/handwriting/brushes'
import type {
  BrushType,
  CanvasDims,
  Page,
  Point,
  Stroke,
  Tool,
} from '@/lib/handwriting/types'
import type { StrokeMode } from '@/lib/handwriting/types'

const MAX_HISTORY = 80

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`

const emptyPage = (): Page => ({ id: uid(), strokes: [] })

/* ───────── historia (Memento) sobre Page[] ───────── */

interface HistoryState {
  past: Page[][]
  present: Page[]
  future: Page[][]
}

type HistoryAction =
  | { type: 'commit'; pages: Page[] }
  | { type: 'undo' }
  | { type: 'redo' }

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'commit':
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: action.pages,
        future: [],
      }
    case 'undo': {
      if (state.past.length === 0) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: state.future[0],
        future: state.future.slice(1),
      }
    }
    default:
      return state
  }
}

/* ───────── config ───────── */

export interface UseHandwritingOptions {
  /** proporción alto/ancho de la página (papel ≈ 1.3). El alto se deriva del ancho. */
  aspectRatio?: number
  /** límites del alto lógico (px) para que la página entre en pantalla */
  minHeight?: number
  maxHeight?: number
  /** callback con el PNG del documento (o '' si está vacío) */
  onChange?: (dataUrl: string) => void
}

export function useHandwriting({
  aspectRatio = 1.3,
  minHeight = 320,
  maxHeight = 1100,
  onChange,
}: UseHandwritingOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const cacheRef = useRef<HTMLCanvasElement | null>(null)

  /* ── herramienta ── */
  const [tool, setTool] = useState<Tool>('draw')
  const [brush, setBrushState] = useState<BrushType>('pen')
  const [color, setColor] = useState('#111111')
  const [size, setSize] = useState(getBrush('pen').defaultSize)

  const setBrush = useCallback((id: BrushType) => {
    setBrushState(id)
    setSize(getBrush(id).defaultSize)
  }, [])

  /* ── dimensiones (el alto se deriva del ancho) ── */
  const [dims, setDims] = useState<CanvasDims>({
    width: 0,
    height: minHeight,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  })

  /* ── documento + historia ── */
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: [emptyPage()],
    future: [],
  }))
  const pages = history.present
  const [pageIndex, setPageIndex] = useState(0)

  // el índice nunca puede quedar fuera de rango (p. ej. tras undo de addPage)
  const safeIndex = Math.min(pageIndex, pages.length - 1)
  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(pages.length - 1)
  }, [pages.length, pageIndex])

  const currentPage = pages[safeIndex]

  /* ── refs vivos para handlers estables ── */
  const cfg = useRef({ tool, brush, color, size, index: safeIndex })
  cfg.current = { tool, brush, color, size, index: safeIndex }

  const pagesRef = useRef(pages)
  pagesRef.current = pages

  const drawingRef = useRef(false)
  const activeRef = useRef<Stroke | null>(null)

  /* ───────── medición responsive (ancho + DPR) ───────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const width = el.clientWidth
      const dpr = window.devicePixelRatio || 1
      const height = Math.round(
        Math.max(minHeight, Math.min(maxHeight, width * aspectRatio)),
      )
      setDims((d) =>
        d.width === width && d.dpr === dpr && d.height === height
          ? d
          : { width, height, dpr },
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspectRatio, minHeight, maxHeight])

  /* ───────── setup del canvas al cambiar dimensiones ───────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dims.width === 0) return
    const ctx = setupCanvas(canvas, dims)
    if (!ctx) return
    ctxRef.current = ctx
  }, [dims])

  /* ───────── re-render (caché + blit) + export ───────── */
  useEffect(() => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas || dims.width === 0 || !currentPage) return
    // reconstruye la caché de la página actual y la vuelca al lienzo
    cacheRef.current = createInkCanvas(currentPage.strokes, dims)
    blit(ctx, cacheRef.current)
    onChange?.(documentHasInk(pages) ? exportDocumentToDataURL(pages, dims) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, safeIndex, dims])

  /* ───────── puntero ───────── */
  const pointFromEvent = useCallback(
    (e: PointerEvent | React.PointerEvent): Point => {
      const rect = canvasRef.current!.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
        t: performance.now(),
      }
    },
    [],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.setPointerCapture(e.pointerId)
      const { tool: t, brush: b, color: c, size: s } = cfg.current
      const mode: StrokeMode = t === 'erase' ? 'erase' : 'draw'
      drawingRef.current = true
      activeRef.current = {
        id: uid(),
        mode,
        brush: b,
        color: c,
        size: mode === 'erase' ? Math.max(s * 6, 20) : s,
        points: [pointFromEvent(e)],
      }
    },
    [pointFromEvent],
  )

  const paintLive = useCallback(() => {
    const ctx = ctxRef.current
    const cache = cacheRef.current
    const active = activeRef.current
    if (!ctx || !cache || !active) return
    blit(ctx, cache)
    drawStroke(ctx, active)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || !activeRef.current) return
      const events =
        'getCoalescedEvents' in e.nativeEvent
          ? e.nativeEvent.getCoalescedEvents()
          : [e.nativeEvent]
      for (const ev of events) activeRef.current.points.push(pointFromEvent(ev))
      // un solo repintado por frame de eventos
      requestAnimationFrame(paintLive)
    },
    [paintLive, pointFromEvent],
  )

  const commitPages = useCallback((next: Page[]) => {
    dispatch({ type: 'commit', pages: next })
  }, [])

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const active = activeRef.current
    activeRef.current = null
    if (!active || active.points.length === 0) return
    const idx = cfg.current.index
    const next = pagesRef.current.map((p, i) =>
      i === idx ? { ...p, strokes: [...p.strokes, active] } : p,
    )
    commitPages(next)
  }, [commitPages])

  /* ───────── comandos ───────── */
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  const clearPage = useCallback(() => {
    const idx = cfg.current.index
    if (!pagesRef.current[idx]?.strokes.length) return
    commitPages(
      pagesRef.current.map((p, i) => (i === idx ? { ...p, strokes: [] } : p)),
    )
  }, [commitPages])

  const addPage = useCallback(() => {
    const next = [...pagesRef.current, emptyPage()]
    commitPages(next)
    setPageIndex(next.length - 1)
  }, [commitPages])

  const deletePage = useCallback(() => {
    if (pagesRef.current.length <= 1) return
    const idx = cfg.current.index
    commitPages(pagesRef.current.filter((_, i) => i !== idx))
    setPageIndex((cur) => Math.max(0, cur - 1))
  }, [commitPages])

  const goToPage = useCallback(
    (i: number) => setPageIndex(Math.max(0, Math.min(i, pagesRef.current.length - 1))),
    [],
  )

  const handlers = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endStroke,
      onPointerCancel: endStroke,
      onPointerLeave: endStroke,
    }),
    [onPointerDown, onPointerMove, endStroke],
  )

  return {
    // DOM
    canvasRef,
    containerRef,
    dims,
    // herramienta
    tool,
    setTool,
    brush,
    setBrush,
    color,
    setColor,
    size,
    setSize,
    // historia
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    isEmpty: !documentHasInk(pages),
    undo,
    redo,
    clearPage,
    // páginas
    pageCount: pages.length,
    pageIndex: safeIndex,
    currentPageEmpty: !currentPage || currentPage.strokes.length === 0,
    addPage,
    deletePage,
    goToPage,
    // eventos
    handlers,
  }
}
