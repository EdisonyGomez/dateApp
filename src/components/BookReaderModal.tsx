"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Calendar, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

/**
 * BookReaderModal
 * Lectura tipo libro con pase de página de PAPEL FLEXIBLE.
 *
 * Cómo se logra la suavidad (sin dependencias nuevas):
 * - La hoja no es un plano rígido: se divide en SEGMENTOS verticales encadenados
 *   (cada uno hijo del anterior), y el ángulo total se reparte de forma desigual
 *   entre ellos. Los segmentos del borde libre giran más que los del lomo, así el
 *   papel se comba a mitad del giro y vuelve a quedar plano al aterrizar.
 * - Un solo loop requestAnimationFrame escribe los transforms por frame, con easing
 *   de arranque lento / caída rápida / aterrizaje muy suave (940ms).
 * - Brillo especular y sombra de curvatura que barren la superficie mientras se dobla.
 *
 * Nota sobre librerías: framer-motion (ya en el proyecto) anima transforms muy bien,
 * pero no dobla papel; para un curl con física completa la alternativa es
 * `react-pageflip` (StPageFlip) o `page-flip`, que exigen páginas de tamaño fijo y
 * reemplazan todo este visor. Esta versión mantiene el layout responsive actual.
 */
export interface BookReaderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pages: string[]
    title: string
    author: string
    dateLabel: string
    theme?: "own" | "partner"
}

type Palette = {
    edge: string
    page: string
    /** Fondo OPACO de la hoja: sin él se transparenta el texto de la página de abajo */
    pageBg: string
    pageGradient: string
    ink: string
    accent: string
    border: string
    glow: string
}

const DUR = 940
const SEGMENTS = 6

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false
    )
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < breakpoint)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [breakpoint])
    return isMobile
}

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

/** Arranque lento, caída rápida, aterrizaje suave */
const ease = (t: number) => 1 - Math.pow(1 - t, 3.2) * Math.cos(t * 0.45)
/** Curvatura: 0 en los extremos, máxima a mitad del giro */
const bendAt = (t: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.85)

function paperBackground(kind: "left" | "right" | "single", gradient: string) {
    const corner = kind === "left" ? "100%" : "0%"
    const rules = kind === "single"
        ? `repeating-linear-gradient(transparent,transparent 28px, rgba(0,0,0,0.045) 28px, rgba(0,0,0,0.045) 29px)`
        : `
    radial-gradient(100px 30px at ${corner} 0%, rgba(0,0,0,0.06), transparent 70%),
    radial-gradient(100px 30px at ${corner} 100%, rgba(0,0,0,0.06), transparent 70%),
    repeating-linear-gradient(transparent,transparent 28px, rgba(0,0,0,0.045) 28px, rgba(0,0,0,0.045) 29px)
  `
    // El degradado del tema va DENTRO de background-image: si se deja en la clase
    // `bg-gradient-to-br`, este backgroundImage inline la pisa y la hoja queda transparente.
    return `${rules}, ${gradient}`
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
    open,
    onOpenChange,
    pages,
    title,
    author,
    dateLabel,
    theme = "own",
}) => {
    const isMobile = useIsMobile()
    const reducedMotion = useReducedMotion()
    const pagesPerSheet = isMobile ? 1 : 2

    const [sheetIndex, setSheetIndex] = useState(0)
    const [flipping, setFlipping] = useState<null | "next" | "prev">(null)
    /** true cuando la hoja pasó la mitad: la página de destino ya se puede revelar debajo */
    const [halfway, setHalfway] = useState(false)

    const totalSheets = Math.ceil(Math.max(1, pages.length) / pagesPerSheet)

    useEffect(() => {
        if (open) {
            setSheetIndex(0)
            setFlipping(null)
            setHalfway(false)
        }
    }, [open])

    useEffect(() => {
        setSheetIndex((i) => Math.min(i, totalSheets - 1))
    }, [totalSheets])

    const palette: Palette = theme === "own"
        ? {
            edge: "from-rose-200 to-pink-200",
            page: "from-rose-50 to-amber-50",
            pageBg: "#fff6f0",
            pageGradient: "linear-gradient(135deg,#fff1f2,#fffbeb)",
            ink: "text-rose-900",
            accent: "text-rose-600",
            border: "border-rose-200",
            glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
        }
        : {
            edge: "from-indigo-200 to-sky-200",
            page: "from-indigo-50 to-amber-50",
            pageBg: "#f3f4fd",
            pageGradient: "linear-gradient(135deg,#eef2ff,#fffbeb)",
            ink: "text-indigo-900",
            accent: "text-indigo-600",
            border: "border-indigo-200",
            glow: "shadow-[0_0_40px_rgba(79,70,229,0.15)]",
        }

    const pageAt = (i: number) => pages[i] ?? ""
    const canPrev = sheetIndex > 0
    const canNext = sheetIndex < totalSheets - 1

    const turn = useCallback(
        (dir: "next" | "prev") => {
            if (flipping) return
            if (dir === "next" && !canNext) return
            if (dir === "prev" && !canPrev) return
            if (reducedMotion) {
                setSheetIndex((i) => (dir === "next" ? i + 1 : i - 1))
                return
            }
            setHalfway(false)
            setFlipping(dir)
        },
        [flipping, canNext, canPrev, reducedMotion]
    )

    const finishTurn = useCallback(() => {
        setSheetIndex((i) => (flipping === "next" ? i + 1 : i - 1))
        setFlipping(null)
        setHalfway(false)
    }, [flipping])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") turn("next")
            if (e.key === "ArrowLeft") turn("prev")
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, turn])

    // ───────── Composición del spread ─────────
    const L = (s: number) => (isMobile ? pageAt(s) : pageAt(s * 2))
    const R = (s: number) => (isMobile ? "" : pageAt(s * 2 + 1))
    const target = flipping === "next" ? sheetIndex + 1 : sheetIndex - 1

    // La hoja que vuela lleva la cara visible actual; la de destino se descubre al pasar la mitad.
    let baseLeft = L(sheetIndex)
    let baseLeftNum = isMobile ? sheetIndex + 1 : sheetIndex * 2 + 1
    let baseRight = R(sheetIndex)
    let baseRightNum = sheetIndex * 2 + 2
    let flyingContent = ""

    if (flipping === "next") {
        flyingContent = isMobile ? L(sheetIndex) : R(sheetIndex)
        if (isMobile) {
            if (halfway) { baseLeft = L(target); baseLeftNum = target + 1 }
        } else {
            baseRight = R(target); baseRightNum = target * 2 + 2
            if (halfway) { baseLeft = L(target); baseLeftNum = target * 2 + 1 }
        }
    } else if (flipping === "prev") {
        flyingContent = L(sheetIndex)
        if (isMobile) {
            if (halfway) { baseLeft = L(target); baseLeftNum = target + 1 }
        } else {
            baseLeft = L(target); baseLeftNum = target * 2 + 1
            if (halfway) { baseRight = R(target); baseRightNum = target * 2 + 2 }
        }
    }

    const flyingVariant: "single" | "left" | "right" = isMobile
        ? "single"
        : flipping === "next" ? "right" : "left"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "max-w-6xl w-[95vw] h-[90vh] min-h-[540px] p-0 overflow-hidden rounded-3xl border-0",
                    "bg-gradient-to-br from-white via-neutral-50 to-neutral-100",
                    "outline-none"
                )}
                aria-describedby={undefined}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Lectura de entrada en formato libro</DialogDescription>
                </DialogHeader>

                <div className="flex flex-row items-center flex-wrap justify-stretch px-6 md:pt-2 lg:pt-2 lg:mt-2 -mt-7 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl bg-gradient-to-br", palette.edge)}>
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-800 line-clamp-1">{title}</h2>
                            <p className={cn("text-xs", palette.accent)}>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {dateLabel}
                                </span>{" "}
                                • {author}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-medium", palette.accent)}>
                            {isMobile ? "Página" : "Hoja"} {sheetIndex + 1} de {totalSheets}
                        </span>
                    </div>
                </div>

                <div className={cn("relative lg:h-2/3 px-1 h-3/4 lg:w-full md:w-full", isMobile ? "w-[94%]" : "w-[90%]")}>
                    <div
                        className={cn(
                            "relative lg:mx-auto md:mx-auto mx-2 md:h-full lg:h-full border md:w-11/12 lg:w-11/12 h-[125%]",
                            isMobile ? "w-full" : "w-[88%]",
                            "-mt-10 lg:-mt-4",
                            isMobile ? "aspect-[3/4]" : "sm:aspect-[16/10] md:aspect-h-16 aspect-1",
                            "rounded-[28px] border overflow-hidden",
                            palette.border,
                            "bg-neutral-50/70 backdrop-blur-sm",
                            palette.glow
                        )}
                        style={{ perspective: 2200, perspectiveOrigin: "center center" }}
                    >
                        {/* Páginas en reposo / destino */}
                        <PageFace
                            variant={isMobile ? "single" : "left"}
                            content={baseLeft}
                            pageNumber={baseLeftNum}
                            palette={palette}
                        />
                        {!isMobile && (
                            <PageFace variant="right" content={baseRight} pageNumber={baseRightNum} palette={palette} />
                        )}

                        {!isMobile && (
                            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-6 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(0,0,0,0.10),rgba(0,0,0,0.02)_45%,rgba(255,255,255,0.35)_50%,rgba(0,0,0,0.02)_55%,rgba(0,0,0,0.10))] opacity-80" />
                        )}

                        {/* Hoja flexible en vuelo */}
                        {flipping && (
                            <FlexibleSheet
                                key={`${flipping}-${sheetIndex}`}
                                dir={flipping}
                                variant={flyingVariant}
                                content={flyingContent}
                                palette={palette}
                                onHalfway={() => setHalfway(true)}
                                onDone={finishTurn}
                            />
                        )}

                        <button
                            onClick={() => turn("prev")}
                            disabled={!canPrev || !!flipping}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 left-3 z-40",
                                "rounded-full p-2 md:p-3 bg-white/90 border border-neutral-300 shadow-lg",
                                "transition hover:bg-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            )}
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-neutral-700" />
                        </button>
                        <button
                            onClick={() => turn("next")}
                            disabled={!canNext || !!flipping}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 right-3 z-40",
                                "rounded-full p-2 md:p-3 bg-white/90 border border-neutral-300 shadow-lg",
                                "transition hover:bg-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            )}
                            aria-label="Página siguiente"
                        >
                            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-neutral-700" />
                        </button>

                        {/* Zonas táctiles tipo e-reader */}
                        <button
                            onClick={() => turn("prev")}
                            disabled={!canPrev || !!flipping}
                            aria-hidden
                            tabIndex={-1}
                            className="absolute inset-y-0 left-0 z-10 w-1/4 cursor-w-resize disabled:cursor-default"
                        />
                        <button
                            onClick={() => turn("next")}
                            disabled={!canNext || !!flipping}
                            aria-hidden
                            tabIndex={-1}
                            className="absolute inset-y-0 right-0 z-10 w-1/4 cursor-e-resize disabled:cursor-default"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Hoja que se dobla: SEGMENTS divs anidados; el ángulo total se reparte entre ellos
 * con más peso en el borde libre, de modo que el papel se curva a mitad del giro.
 */
function FlexibleSheet({
    dir,
    variant,
    content,
    palette,
    onHalfway,
    onDone,
}: {
    dir: "next" | "prev"
    variant: "single" | "left" | "right"
    content: string
    palette: Palette
    onHalfway: () => void
    onDone: () => void
}) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const segRefs = useRef<(HTMLDivElement | null)[]>([])
    const sheenRef = useRef<HTMLDivElement | null>(null)
    const bendRef = useRef<HTMLDivElement | null>(null)
    const castRef = useRef<HTMLDivElement | null>(null)
    const halfFired = useRef(false)

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

            if (!halfFired.current && t > 0.5) {
                halfFired.current = true
                onHalfway()
            }

            const root = rootRef.current
            if (root) {
                // la hoja se despega ligeramente del lomo
                root.style.transform = `translateZ(${(18 * bend).toFixed(2)}px) rotateY(${(total * 0.34).toFixed(3)}deg)`
            }

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
            if (castRef.current) castRef.current.style.opacity = (0.3 * (1 - e)).toFixed(3)

            if (t < 1) raf = requestAnimationFrame(step)
            else onDone()
        }
        raf = requestAnimationFrame(step)
        // Red de seguridad: la hoja nunca puede quedarse pegada en pantalla
        const safety = setTimeout(onDone, DUR + 220)
        return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const step = 100 / SEGMENTS
    const single = variant === "single"

    // Segmentos anidados: cada uno contiene su franja de la página y al siguiente segmento
    const buildSegment = (k: number): React.ReactNode => {
        if (k >= SEGMENTS) return null
        const left = k * step
        const right = 100 - (k + 1) * step
        const origin = toNext ? `${left}% center` : `${100 - left}% center`
        return (
            <div
                ref={(n) => { segRefs.current[k] = n }}
                style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: origin }}
            >
                <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${right}% 0 ${left}%)` }}>
                    <PageFace variant={variant} content={content} pageNumber={0} palette={palette} inline />
                </div>
                {buildSegment(k + 1)}
            </div>
        )
    }

    return (
        <>
            {/* Sombra proyectada sobre la página que se descubre */}
            <div
                ref={castRef}
                className={cn(
                    "pointer-events-none absolute inset-y-0 z-20",
                    single ? "left-0 w-full" : toNext ? "left-1/2 w-1/2" : "left-0 w-1/2"
                )}
                style={{
                    opacity: 0.3,
                    mixBlendMode: "multiply",
                    background: toNext
                        ? "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0) 55%)"
                        : "linear-gradient(270deg, rgba(0,0,0,0.35), rgba(0,0,0,0) 55%)",
                }}
            />

            <div
                ref={rootRef}
                className={cn(
                    "absolute inset-y-0 z-30",
                    single ? "left-0 w-full" : toNext ? "left-1/2 w-1/2" : "left-0 w-1/2"
                )}
                style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: toNext ? "left center" : "right center",
                    willChange: "transform",
                }}
            >
                {buildSegment(0)}

                {/* Brillo especular que barre el pliegue */}
                <div
                    ref={sheenRef}
                    className="pointer-events-none absolute inset-0"
                    style={{
                        opacity: 0,
                        background:
                            "linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0) 66%)",
                    }}
                />
                {/* Sombra de curvatura */}
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
        </>
    )
}

/** Cara de página: papel + tipografía de libro. `inline` = ocupa su contenedor. */
function PageFace({
    variant,
    content,
    pageNumber,
    palette,
    inline = false,
}: {
    variant: "left" | "right" | "single"
    content: string
    pageNumber: number
    palette: Palette
    inline?: boolean
}) {
    const single = variant === "single"
    const shadowSide =
        variant === "left"
            ? "shadow-[inset_-40px_0_50px_-40px_rgba(0,0,0,0.08)]"
            : variant === "right"
                ? "shadow-[inset_40px_0_50px_-40px_rgba(0,0,0,0.08)]"
                : ""

    return (
        <div
            className={cn(
                inline ? "absolute inset-0 overflow-hidden" : "absolute inset-y-0 overflow-y-auto custom-scrollbar",
                !inline && (single ? "left-0 w-full" : variant === "left" ? "left-0 w-1/2" : "right-0 w-1/2"),
                single ? "p-6 md:p-8" : variant === "left" ? "p-5 md:p-7 pr-8" : "p-5 md:p-7 pl-8",
                single
                    ? "text-[18px] leading-8 font-serif"
                    : "text-[16px] leading-8 md:text-[17px] md:leading-8 font-serif",
                "tracking-normal hyphens-auto break-words",
                palette.ink,
                shadowSide
            )}
            style={{
                textAlign: single ? "left" : "justify",
                backgroundColor: palette.pageBg,
                backgroundImage: paperBackground(variant, palette.pageGradient),
            }}
        >
            <div className="min-h-full whitespace-pre-wrap [text-wrap:pretty]">
                {content || <span className="opacity-40">—</span>}
            </div>
            {pageNumber > 0 && (
                <div
                    className={cn(
                        "mt-6 text-xs select-none",
                        palette.accent,
                        variant === "left" && !single ? "text-left" : "text-right"
                    )}
                >
                    {pageNumber}
                </div>
            )}
        </div>
    )
}

export default BookReaderModal
