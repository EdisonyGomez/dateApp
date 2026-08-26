import type React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, Heart, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { DailyContent, LearningLanguage, SurpriseState, SurpriseStatus } from "@/lib/dailySurprise/types"
import { RENDERERS } from "./renderers"
import { Confetti } from "./Confetti"

interface DailySurpriseModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  status: SurpriseStatus
  content: DailyContent | null
  completed: boolean
  partnerState: SurpriseState | null
  partnerName?: string
  onComplete: (result?: Record<string, unknown>) => void
  learningLanguage: LearningLanguage | null
  setLearningLanguage: (l: LearningLanguage) => void
  onRetry: () => void
}

export const DailySurpriseModal: React.FC<DailySurpriseModalProps> = ({
  open,
  onOpenChange,
  status,
  content,
  completed,
  partnerState,
  partnerName,
  onComplete,
  learningLanguage,
  setLearningLanguage,
  onRetry,
}) => {
  const [celebrate, setCelebrate] = useState(false)
  const wasCompleted = useRef(completed)

  // dispara confetti cuando la sorpresa pasa a completada estando el modal abierto
  useEffect(() => {
    if (open && completed && !wasCompleted.current) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 2200)
      return () => clearTimeout(t)
    }
    wasCompleted.current = completed
  }, [completed, open])

  const Renderer = content ? RENDERERS[content.kind] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-3xl sm:max-w-md">
        <AnimatePresence>{celebrate && <Confetti />}</AnimatePresence>

        <DialogHeader>
          <motion.div
            initial={{ scale: 0.5, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md"
          >
            <Gift className="h-7 w-7" />
          </motion.div>
          <DialogTitle className="text-center text-xl">Sorpresa del día ✨</DialogTitle>
          <DialogDescription className="sr-only">Daily surprise</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="py-2"
        >
          {status === "empty-pool" && (
            <div className="space-y-2 py-6 text-center text-gray-500">
              <div className="text-4xl">🌱</div>
              <p className="font-medium">Todavía no hay sorpresas cargadas.</p>
              <p className="text-sm">No daily content yet — coming soon!</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3 py-6 text-center text-gray-500">
              <div className="text-4xl">😕</div>
              <p className="font-medium">No pudimos cargar la sorpresa.</p>
              <button type="button" onClick={onRetry} className="text-sm font-semibold text-rose-500 underline">
                Reintentar
              </button>
            </div>
          )}

          {status === "ready" && Renderer && content && (
            <Renderer
              content={content}
              completed={completed}
              onComplete={onComplete}
              learningLanguage={learningLanguage}
              setLearningLanguage={setLearningLanguage}
            />
          )}
        </motion.div>

        {/* conciencia de la pareja */}
        {status === "ready" && (
          <div className="mt-1 flex items-center justify-center gap-1.5 border-t border-pink-100 pt-3 text-xs text-gray-500">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            {partnerState?.completed_at ? (
              <span>
                <span className="font-semibold text-rose-500">{partnerName || "Tu pareja"}</span> ya la completó
                <Check className="ml-1 inline h-3.5 w-3.5 text-green-500" />
              </span>
            ) : partnerState ? (
              <span>{partnerName || "Tu pareja"} ya la vio</span>
            ) : (
              <span>{partnerName || "Tu pareja"} todavía no la ha visto</span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
