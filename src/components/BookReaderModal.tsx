"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

/**
 * BookReaderModal
 * Modal que muestra un “libro” con pase de página, UI/UX profesional.
 * - No hace requests. Renderiza con las páginas ya calculadas.
 * - Accesible: incluye DialogTitle/Description.
 */
export interface BookReaderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Páginas ya pre-computadas (cada item es una “página”) */
    pages: string[]
    /** Metadatos de la entrada */
    title: string
    author: string
    dateLabel: string
    /** Tema de color: "own" si es del usuario actual, "partner" si es de la pareja */
    theme?: "own" | "partner"
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
    // Estado de navegación (spread de 2 páginas: izquierda/derecha)
    const [sheetIndex, setSheetIndex] = useState(0) // cada “sheet” = 2 páginas
    const totalSheets = Math.ceil(Math.max(1, pages.length) / 2)

    // Reset al abrir
    useEffect(() => {
        if (open) setSheetIndex(0)
    }, [open])

    const palette = theme === "own"
        ? {
            edge: "from-rose-200 to-pink-200",
            page: "from-rose-50 to-amber-50",
            ink: "text-rose-900",
            accent: "text-rose-600",
            border: "border-rose-200",
            glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
        }
        : {
            edge: "from-indigo-200 to-sky-200",
            page: "from-indigo-50 to-amber-50",
            ink: "text-indigo-900",
            accent: "text-indigo-600",
            border: "border-indigo-200",
            glow: "shadow-[0_0_40px_rgba(79,70,229,0.15)]",
        }

    // Derivar páginas izquierda / derecha por sheet
    const leftPage = pages[sheetIndex * 2] ?? ""
    const rightPage = pages[sheetIndex * 2 + 1] ?? ""

    const canPrev = sheetIndex > 0
    const canNext = sheetIndex < totalSheets - 1

    const goPrev = () => canPrev && setSheetIndex((i) => i - 1)
    const goNext = () => canNext && setSheetIndex((i) => i + 1)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    // más ancho y alto en laptop y min-height para que no tape controles
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

                {/* Header visible del modal */}
                <div className="flex flex-row items-center  flex-wrap justify-stretch px-6 md:pt-2 lg:pt-2 lg:mt-2 -mt-7 pb-3">
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
                            Hoja {sheetIndex + 1} de {totalSheets}
                        </span>
                    </div>
                </div>

                {/* Zona del “libro” */}
                <div className={cn("relative lg:h-2/3 px-1 h-3/4 lg:w-full md:w-full w-[95%] ")}>
                    <div
                        className={cn(
                            "relative lg:mx-auto md:mx-auto mx-2 md:h-full lg:h-full  border md:w-11/12 lg:w-11/12 w-[88%] h-[125%]  ",
                            " -mt-10 lg:-mt-4 ",
                            // 3:2 aprovecha mejor la vertical en laptop
                            "sm:aspect-[16/10] md:aspect-h-16 aspect-1" , 
                            "rounded-[28px] border ",
                            palette.border,
                            "bg-neutral-50/70 backdrop-blur-sm",
                            palette.glow
                        )}
                    >

                        {/* Lomo / sombra central */}
                        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-300 opacity-70 " />

                        {/* Hoja izquierda */}
                        <Page
                            side="left"
                            content={leftPage}
                            palette={palette}
                            pageNumber={sheetIndex * 2 + 1}
                            key={`sheet-left-${sheetIndex}`}
                        />

                        {/* Hoja derecha */}
                        <Page
                            side="right"
                            content={rightPage}
                            palette={palette}
                            pageNumber={sheetIndex * 2 + 2}
                            key={`sheet-right-${sheetIndex}`}
                        />



                        {/* Botones visibles */}
                        <div className="absolute -bottom-3 left-1/2  flex items-center gap-2">
                            {/* Botones visibles flotantes */}
                            <button
                                onClick={goPrev}
                                disabled={!canPrev}
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 right-3 z-10",
                                    "rounded-full p-2 md:p-3 bg-white/90 border border-neutral-300 shadow-lg",
                                    "hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                )}
                                aria-label="Página anterior"
                                title="Página anterior"
                            >
                                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-neutral-700" />
                            </button>

                            <button
                                onClick={goNext}
                                disabled={!canNext}
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2  z-10",
                                    "rounded-full p-2 md:p-3 bg-white/90 border border-neutral-300 shadow-lg",
                                    "hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                )}
                                aria-label="Página siguiente"
                                title="Página siguiente"
                            >
                                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-neutral-700" />
                            </button>

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/** Página individual (lado izquierdo/derecho) con textura y tipografía de libro */
function Page({
    side,
    content,
    palette,
    pageNumber,
}: {
    side: "left" | "right"
    content: string
    palette: {
        edge: string
        page: string
        ink: string
        accent: string
        border: string
        glow: string
    }
    pageNumber: number
}) {
    const enterX = side === "left" ? -20 : 20
    const shadowSide =
        side === "left"
            ? "shadow-[inset_-40px_0_50px_-40px_rgba(0,0,0,0.08)]"
            : "shadow-[inset_40px_0_50px_-40px_rgba(0,0,0,0.08)]"

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, x: enterX }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -enterX }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={cn(
                    "absolute inset-y-0 w-1/2 p-5 md:p-7 overflow-y-auto custom-scrollbar",
                    side === "left" ? "left-0 pr-8" : "right-0 pl-8",
                    "bg-gradient-to-br",
                    palette.page,
                    // ✨ Tipografía más legible y densa
                    "text-[16px] leading-8 md:text-[17px] md:leading-8 tracking-normal font-serif",
                    "hyphens-auto",
                    "break-words",
                    palette.ink,
                    shadowSide
                )}
                style={{
                    textAlign: "justify",
                    backgroundImage: `
            radial-gradient(100px 30px at ${side === "left" ? "100% 0%" : "0% 0%"}, rgba(0,0,0,0.06), transparent 70%),
            radial-gradient(100px 30px at ${side === "left" ? "100% 100%" : "0% 100%"}, rgba(0,0,0,0.06), transparent 70%),
            repeating-linear-gradient(transparent,transparent 28px, rgba(0,0,0,0.045) 28px, rgba(0,0,0,0.045) 29px)
          `,
                }}
            >
                <div className="min-h-full whitespace-pre-wrap [text-wrap:pretty]">
                    {content || <span className="opacity-50">—</span>}
                </div>
                {/* Número de página */}
                <div
                    className={cn(
                        "mt-6 text-xs select-none",
                        palette.accent,
                        side === "left" ? "text-left" : "text-right"
                    )}
                >
                    {pageNumber}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}


export default BookReaderModal
