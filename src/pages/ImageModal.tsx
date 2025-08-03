"use client"
import type React from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Download, Heart, Sparkles } from "lucide-react"

interface ImageModalProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
}

export const ImageModal: React.FC<ImageModalProps> = ({ images, currentIndex, isOpen, onClose, onIndexChange }) => {
  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
  }

  const handleNext = () => {
    onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = images[currentIndex]
    link.download = `image-${currentIndex + 1}.jpg`
    link.click()
  }

  if (!images.length) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/95 border-0 rounded-2xl overflow-hidden">
        {/* Botón de cerrar */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogClose>

        {/* Partículas decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {[...Array(8)].map((_, i) => (
            <Heart
              key={`heart-${i}`}
              className="absolute text-pink-300/40 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 15 + 10}px`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={`sparkle-${i}`}
              className="absolute text-pink-400/30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 12 + 8}px`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Imagen principal */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          {/* Controles de navegación */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Barra inferior con información */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm opacity-80">
                {currentIndex + 1} de {images.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-pink-500/20 hover:bg-pink-500/30 text-white border border-pink-400/30"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>

          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 justify-center overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onIndexChange(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentIndex ? "border-pink-400 scale-110" : "border-white/30 hover:border-pink-300"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
