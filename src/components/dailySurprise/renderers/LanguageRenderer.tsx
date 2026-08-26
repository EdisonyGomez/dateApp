import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { RendererProps } from "./shared"

/** Práctica de idioma: él aprende inglés, ella español. */
export const LanguageRenderer: React.FC<RendererProps> = ({
  content,
  onComplete,
  learningLanguage,
  setLearningLanguage,
}) => {
  const [revealed, setRevealed] = useState(false)
  if (content.kind !== "language") return null
  const { es, en, example } = content.payload

  // Fallback auto-reparable: si no sabemos qué practica, se lo preguntamos una vez.
  if (!learningLanguage) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">🌎</div>
        <p className="font-semibold text-gray-800">¿Qué idioma estás practicando?</p>
        <p className="text-sm text-gray-400">What language are you practicing?</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => setLearningLanguage("en")} className="rounded-full bg-blue-500 hover:bg-blue-600">
            🇺🇸 English
          </Button>
          <Button onClick={() => setLearningLanguage("es")} className="rounded-full bg-amber-500 hover:bg-amber-600">
            🇨🇴 Español
          </Button>
        </div>
      </div>
    )
  }

  // Prompt en el idioma nativo → adivinar en el que aprende.
  const learnsEnglish = learningLanguage === "en"
  const prompt = learnsEnglish ? es : en
  const target = learnsEnglish ? en : es
  const promptLabel = learnsEnglish ? "en inglés" : "en español"

  const reveal = () => {
    setRevealed(true)
    onComplete()
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">🗣️</div>
      <p className="text-sm text-gray-400">¿Cómo se dice {promptLabel}?</p>
      <p className="text-2xl font-bold text-gray-800">{prompt}</p>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="btn" exit={{ opacity: 0 }}>
            <Button onClick={reveal} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              Revelar
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="ans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-2xl bg-emerald-50 p-4"
          >
            <p className="text-xl font-bold text-emerald-700">{target}</p>
            <p className="text-sm text-gray-600">
              {learnsEnglish ? example.en : example.es}
            </p>
            <p className="text-xs text-gray-400">
              {learnsEnglish ? example.es : example.en}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
