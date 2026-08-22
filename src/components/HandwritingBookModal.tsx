import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HandwritingBookModalProps {
  image: string
  isOpen: boolean
  onClose: () => void
}

const PAGE_ASPECT_RATIO = 1.3

export const HandwritingBookModal: React.FC<HandwritingBookModalProps> = ({
  image,
  isOpen,
  onClose
}) => {
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isOpen) return

    setPage(0)
    const source = new Image()
    source.onload = () => {
      const estimatedPages = source.naturalHeight / source.naturalWidth / PAGE_ASPECT_RATIO
      setTotalPages(estimatedPages > 1.5 ? Math.max(1, Math.round(estimatedPages)) : 1)
    }
    source.src = image
  }, [image, isOpen])

  const next = () => setPage(p => Math.min(totalPages - 1, p + 1))
  const prev = () => setPage(p => Math.max(0, p - 1))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 bg-transparent border-none">
        <div className="relative bg-white rounded-2xl shadow-2xl p-6">

          {/* cerrar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3"
          >
          </Button>

          <div className="mx-auto w-full max-w-[520px]">
            <div className="relative aspect-[10/13] overflow-hidden rounded-xl border bg-white shadow-inner">
              <img
                src={image}
                className={totalPages > 1 ? "absolute inset-x-0 top-0 w-full max-w-none" : "h-full w-full object-contain"}
                style={totalPages > 1 ? { top: `${-page * 100}%` } : undefined}
              />
            </div>
          </div>

          {/* navegación */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={prev}
              disabled={page === 0}
            >
              <ChevronLeft className="mr-2" />
              Prev
            </Button>

            <Button
              variant="outline"
              onClick={next}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
