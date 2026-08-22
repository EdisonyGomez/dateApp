import React from 'react'
import {
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useHandwriting } from '@/hooks/useHandwriting'
import { BRUSH_LIST, PALETTE, getBrush } from '@/lib/handwriting/brushes'
import type { BrushType } from '@/lib/handwriting/types'

interface HandwritingPadProps {
  onChange: (dataUrl: string) => void
  /** proporción alto/ancho de la página (papel ≈ 1.3) */
  aspectRatio?: number
}

/** Ícono expresivo por pincel (trazo SVG que insinúa su forma). */
const BrushGlyph: React.FC<{ id: BrushType; color: string }> = ({ id, color }) => {
  const common = { stroke: color, fill: 'none', strokeLinecap: 'round' as const }
  const shapes: Record<BrushType, React.ReactNode> = {
    pen: <path d="M3 12c4 0 6-5 9-5s5 5 9 5" strokeWidth={2.5} {...common} />,
    fountain: <path d="M3 14c4 1 6-6 9-6s5 7 9 4" strokeWidth={3.5} {...common} />,
    marker: <path d="M3 12h18" strokeWidth={6} {...common} />,
    highlighter: <path d="M3 12h18" strokeWidth={9} stroke={color} opacity={0.4} fill="none" strokeLinecap="butt" />,
    pencil: <path d="M3 12c4 0 6-4 9-4s5 4 9 4" strokeWidth={1.5} {...common} />,
    neon: (
      <path
        d="M3 12c4 0 6-5 9-5s5 5 9 5"
        strokeWidth={3}
        {...common}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    ),
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-full">
      {shapes[id]}
    </svg>
  )
}

/**
 * Estudio de escritura manual — pensado para gente que ama dibujar y escribir.
 * - Tinta perfect-freehand (sensación Apple Pencil / Samsung Notes)
 * - 6 pinceles con efectos: Bolígrafo, Pluma, Marcador, Resaltador, Lápiz, Neón
 * - Selección pro por popovers (pincel + grosor, paleta + color libre)
 * - Goma real (borra solo lo que toca) · Undo / Redo · Clear undoable
 * - Documento multi-página: agregá páginas a voluntad y navegá entre ellas
 *
 * Presentacional puro: la lógica vive en useHandwriting.
 */
export const HandwritingPad: React.FC<HandwritingPadProps> = ({
  onChange,
  aspectRatio = 1.3,
}) => {
  const pad = useHandwriting({ aspectRatio, onChange })
  const activeBrush = getBrush(pad.brush)
  const isEraser = pad.tool === 'erase'

  return (
    <div className="space-y-3">
      {/* ───────── Toolbar principal ───────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Selector de pincel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={isEraser ? 'outline' : 'default'}
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => pad.setTool('draw')}
            >
              <span className="grid h-5 w-8 place-items-center">
                <BrushGlyph id={pad.brush} color={isEraser ? 'currentColor' : pad.color} />
              </span>
              {activeBrush.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 rounded-2xl p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Pincel</p>
            <div className="grid grid-cols-3 gap-2">
              {BRUSH_LIST.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => pad.setBrush(b.id)}
                  aria-pressed={pad.brush === b.id && !isEraser}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2 transition hover:bg-accent',
                    pad.brush === b.id && !isEraser
                      ? 'border-primary bg-accent ring-1 ring-primary'
                      : 'border-transparent',
                  )}
                >
                  <BrushGlyph id={b.id} color={pad.color} />
                  <span className="text-[11px] leading-none">{b.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Grosor</span>
                <span>{pad.size.toFixed(1)}px</span>
              </div>
              <Slider
                value={[pad.size]}
                min={activeBrush.min}
                max={activeBrush.max}
                step={0.5}
                onValueChange={([v]) => pad.setSize(v)}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Selector de color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              title="Color"
              aria-label="Elegir color"
            >
              <span
                className="h-5 w-5 rounded-full border shadow-inner"
                style={{ backgroundColor: pad.color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 rounded-2xl p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
            <div className="grid grid-cols-8 gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pad.setColor(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full border transition hover:scale-110',
                    pad.color === c && 'ring-2 ring-ring ring-offset-1',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {pad.color === c && (
                    <Check
                      className="h-3.5 w-3.5"
                      style={{ color: c === '#ffffff' ? '#111' : '#fff' }}
                    />
                  )}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="color"
                value={pad.color}
                onChange={(e) => pad.setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-md border bg-transparent p-0"
              />
              Color personalizado
            </label>
          </PopoverContent>
        </Popover>

        {/* Goma */}
        <Button
          type="button"
          variant={isEraser ? 'default' : 'outline'}
          size="icon"
          className="rounded-full"
          onClick={() => pad.setTool(isEraser ? 'draw' : 'erase')}
          aria-pressed={isEraser}
          title="Goma"
          aria-label="Goma"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="mx-0.5 h-6 w-px bg-border" aria-hidden />

        {/* Undo / Redo / Clear */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={pad.undo}
          disabled={!pad.canUndo}
          title="Deshacer"
          aria-label="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={pad.redo}
          disabled={!pad.canRedo}
          title="Rehacer"
          aria-label="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full text-destructive"
          onClick={pad.clearPage}
          disabled={pad.currentPageEmpty}
          title="Limpiar página"
          aria-label="Limpiar página"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* ───────── Hoja ───────── */}
      <div
        ref={pad.containerRef}
        className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      >
        <canvas
          ref={pad.canvasRef}
          className={cn(
            'handwriting-canvas block w-full touch-none',
            isEraser ? 'cursor-cell' : 'cursor-crosshair',
          )}
          {...pad.handlers}
        />
      </div>

      {/* ───────── Navegación de páginas ───────── */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => pad.goToPage(pad.pageIndex - 1)}
          disabled={pad.pageIndex === 0}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="min-w-[92px] text-center text-sm text-muted-foreground">
          Página {pad.pageIndex + 1} / {pad.pageCount}
        </span>

        {pad.pageIndex < pad.pageCount - 1 ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={() => pad.goToPage(pad.pageIndex + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1 rounded-full"
            onClick={pad.addPage}
          >
            <Plus className="h-4 w-4" />
            Agregar página
          </Button>
        )}

        {pad.pageCount > 1 && pad.currentPageEmpty && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={pad.deletePage}
            title="Quitar esta página vacía"
            aria-label="Quitar página"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
