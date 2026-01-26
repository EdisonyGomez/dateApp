import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface HandwritingPadProps {
    onChange: (dataUrl: string) => void
}

/**
 * Área de escritura manual tipo "hoja larga"
 * Soporta:
 * - Touch
 * - Mouse
 * - Stylus / S-Pen
 */
export const HandwritingPad: React.FC<HandwritingPadProps> = ({ onChange }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawing = useRef(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#111'
        ctx.lineWidth = 2

        // 📏 Altura tipo hoja larga
        canvas.width = canvas.offsetWidth
        canvas.height = 10000
    }, [])

    const start = (e: React.PointerEvent) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        drawing.current = true
        ctx.beginPath()
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    }

    const move = (e: React.PointerEvent) => {
        if (!drawing.current) return
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
        ctx.stroke()
    }

    const end = () => {
        drawing.current = false
        const canvas = canvasRef.current
        if (!canvas) return
        onChange(canvas.toDataURL('image/png'))
    }

    const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange('')
    }

    return (
        <div className="space-y-2">
            {/* CONTENEDOR CON SCROLL */}
            <div className="border rounded-lg h-[400px] overflow-y-auto bg-white">
                <canvas
                    ref={canvasRef}
                    className="w-full touch-none handwriting-canvas"
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                />

            </div>

            <Button type="button" variant="outline" size="sm" onClick={clear}>
                Clear
            </Button>
        </div>

    )
}
