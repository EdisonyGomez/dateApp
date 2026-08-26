import type React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sparkles, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Bilingual, type RendererProps } from "./shared"

/** Chiste: setup → tocar → remate. */
export const JokeRenderer: React.FC<RendererProps> = ({ content, onComplete }) => {
  const [revealed, setRevealed] = useState(false)
  if (content.kind !== "joke") return null
  const { setup, punchline } = content.payload

  const reveal = () => {
    setRevealed(true)
    onComplete()
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">😄</div>
      <Bilingual value={setup} className="space-y-0.5 text-lg font-semibold" />

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="btn" exit={{ opacity: 0 }}>
            <Button
              onClick={reveal}
              className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ver el remate
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="punch"
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="rounded-2xl bg-rose-50 p-4"
          >
            <Bilingual value={punchline} className="space-y-0.5 text-lg font-bold text-rose-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Adivinanza: pregunta → pista opcional → revelar respuesta. */
export const RiddleRenderer: React.FC<RendererProps> = ({ content, onComplete }) => {
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  if (content.kind !== "riddle") return null
  const { question, answer, hint } = content.payload

  const reveal = () => {
    setRevealed(true)
    onComplete()
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">🧩</div>
      <Bilingual value={question} className="space-y-0.5 text-lg font-semibold" />

      {hint && showHint && !revealed && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-amber-600">
          💡 {hint.es} · {hint.en}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="actions" exit={{ opacity: 0 }} className="flex justify-center gap-2">
            {hint && !showHint && (
              <Button variant="outline" onClick={() => setShowHint(true)} className="rounded-full">
                <Lightbulb className="mr-2 h-4 w-4" />
                Pista
              </Button>
            )}
            <Button
              onClick={reveal}
              className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
            >
              Ver respuesta
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="answer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 15 }}
            className="rounded-2xl bg-violet-50 p-4"
          >
            <Bilingual value={answer} className="space-y-0.5 text-lg font-bold text-violet-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
