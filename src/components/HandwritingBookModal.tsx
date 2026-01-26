import React, { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface HandwritingBookModalProps {
  image: string
  isOpen: boolean
  onClose: () => void
}

const PAGE_HEIGHT_PERCENT = 50 // 2 páginas visibles

export const HandwritingBookModal: React.FC<HandwritingBookModalProps> = ({
  image,
  isOpen,
  onClose
}) => {
  const [page, setPage] = useState(0)

  const next = () => setPage(p => p + 1)
  const prev = () => setPage(p => Math.max(0, p - 1))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 bg-transparent border-none">
        <div className="relative bg-white rounded-2xl shadow-2xl p-6">

          {/* cerrar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3"
          >
          </Button>

          {/* libro */}
          <div className="grid grid-cols-2 gap-6">
            {[0, 1].map(i => {
              const offset = (page * 2 + i) * PAGE_HEIGHT_PERCENT
              return (
                <div
                  key={i}
                  className="aspect-[3/4] border rounded-xl overflow-hidden bg-white shadow-inner"
                >
                  <img
                    src={image}
                    className="w-full h-full object-cover object-top"
                    style={{
                      transform: `translateY(-${offset}%)`
                    }}
                  />
                </div>
              )
            })}
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

            <Button variant="outline" onClick={next}>
              Next
              <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
