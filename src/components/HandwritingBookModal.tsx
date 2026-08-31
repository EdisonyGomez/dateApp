import React, { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HandwritingBookModalProps {
  image: string
  isOpen: boolean
  onClose: () => void
}

const PAGE_ASPECT_RATIO = 1.3
const DUR = 900
const SEGMENTS = 6

/** Arranque lento, caída rápida, aterrizaje suave. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3.2) * Math.cos(t * 0.45)
/** Curvatura: 0 en los extremos, máxima a mitad del giro. */
const bendAt = (t: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.85)

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return reduced
}

/** Cara = slice `page` de la imagen alta, dentro de la ventana. */
const ImageFace: React.FC<{ image: string; page: number }> = ({ image, page }) => (
  <div className="absolute inset-0 overflow-hidden bg-white">
    <img src={image} alt="" className="absolute inset-x-0 w-full max-w-none" style={{ top: `${-page * 100}%` }} />
  </div>
)

/**
 * Hoja de papel flexible que se dobla (6 segmentos anidados). Muestra el
 * slice `page` y curla hacia afuera revelando el destino que está debajo.
 */
function FlexibleImageSheet({
  image,
  page,
  dir,
  onDone,
}: {
  image: string
  page: number
  dir: "next" | "prev"
  onDone: () => void
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const segRefs = useRef<(HTMLDivElement | null)[]>([])
  const sheenRef = useRef<HTMLDivElement | null>(null)
  const bendRef = useRef<HTMLDivElement | null>(null)

  const toNext = dir === "next"
  const from = toNext ? 0 : -180
  const to = toNext ? -180 : 0

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DUR)
      const e = ease(t)
      const total = from + (to - from) * e
      const bend = bendAt(t)

      const root = rootRef.current
      if (root) root.style.transform = `translateZ(${(18 * bend).toFixed(2)}px) rotateY(${(total * 0.34).toFixed(3)}deg)`

      const segs = segRefs.current.filter(Boolean) as HTMLDivElement[]
      const N = segs.length
      const rest = total * 0.66
      const weights = segs.map((_, k) => 1 + bend * 0.9 * ((k - (N - 1) / 2) / ((N - 1) / 2)))
      const sum = weights.reduce((a, b) => a + b, 0)
      segs.forEach((s, k) => {
        const share = (rest * weights[k]) / sum
        s.style.transform = `rotateY(${share.toFixed(3)}deg) translateZ(${(bend * 1.6 * (k + 1)).toFixed(2)}px)`
      })

      if (sheenRef.current) {
        sheenRef.current.style.opacity = (bend * 0.5).toFixed(3)
        sheenRef.current.style.transform = `translateX(${(-40 + 80 * t).toFixed(1)}%)`
      }
      if (bendRef.current) bendRef.current.style.opacity = (bend * 0.45).toFixed(3)

      if (t < 1) raf = requestAnimationFrame(step)
      else onDone()
    }
    raf = requestAnimationFrame(step)
    const safety = setTimeout(onDone, DUR + 220)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stepPct = 100 / SEGMENTS
  const buildSegment = (k: number): React.ReactNode => {
    if (k >= SEGMENTS) return null
    const left = k * stepPct
    const right = 100 - (k + 1) * stepPct
    const origin = toNext ? `${left}% center` : `${100 - left}% center`
    return (
      <div
        ref={(n) => {
          segRefs.current[k] = n
        }}
        style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: origin }}
      >
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${right}% 0 ${left}%)` }}>
          <ImageFace image={image} page={page} />
        </div>
        {buildSegment(k + 1)}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-30"
      style={{ transformStyle: "preserve-3d", transformOrigin: toNext ? "left center" : "right center", willChange: "transform" }}
    >
      {buildSegment(0)}
      <div
        ref={sheenRef}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, background: "linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0) 66%)" }}
      />
      <div
        ref={bendRef}
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0,
          mixBlendMode: "multiply",
          background: toNext
            ? "linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0) 45%)"
            : "linear-gradient(270deg, rgba(0,0,0,0.28), rgba(0,0,0,0) 45%)",
        }}
      />
    </div>
  )
}

export const HandwritingBookModal: React.FC<HandwritingBookModalProps> = ({ image, isOpen, onClose }) => {
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [flip, setFlip] = useState<null | { dir: "next" | "prev"; from: number; to: number }>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return
    setPage(0)
    setFlip(null)
    const source = new Image()
    source.onload = () => {
      const estimated = source.naturalHeight / source.naturalWidth / PAGE_ASPECT_RATIO
      setTotalPages(estimated > 1.5 ? Math.max(1, Math.round(estimated)) : 1)
    }
    source.src = image
  }, [image, isOpen])

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (flip) return
      const target = dir === "next" ? Math.min(totalPages - 1, page + 1) : Math.max(0, page - 1)
      if (target === page) return
      if (reduced) {
        setPage(target)
        return
      }
      setFlip({ dir, from: page, to: target })
      setPage(target) // el destino queda debajo mientras la hoja curla
    },
    [flip, page, totalPages, reduced],
  )

  const single = totalPages <= 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl border-none bg-transparent p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -8 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative rounded-2xl bg-white p-5 shadow-2xl"
          style={{ perspective: 2000 }}
        >
          <div className="mx-auto w-full max-w-[520px]">
            <div
              className={cn("relative aspect-[10/13] overflow-hidden rounded-xl border bg-white shadow-inner")}
              style={{ perspective: 2000 }}
            >
              {single ? (
                <img src={image} alt="Handwriting" className="h-full w-full object-contain" />
              ) : (
                <>
                  {/* Página base (destino durante el giro) */}
                  <ImageFace image={image} page={page} />
                  {/* Hoja que curla mostrando la página de origen */}
                  {flip && (
                    <FlexibleImageSheet
                      key={`${flip.dir}-${flip.from}`}
                      image={image}
                      page={flip.from}
                      dir={flip.dir}
                      onDone={() => setFlip(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => go("prev")}
              disabled={page === 0 || !!flip}
              className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-medium shadow transition hover:bg-white active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-xs font-medium text-neutral-500">
              {single ? "" : `${page + 1} / ${totalPages}`}
            </span>
            <button
              onClick={() => go("next")}
              disabled={page >= totalPages - 1 || !!flip}
              className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-medium shadow transition hover:bg-white active:scale-95 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
