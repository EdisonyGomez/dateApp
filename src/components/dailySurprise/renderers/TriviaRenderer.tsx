import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Bilingual, type RendererProps } from "./shared"

/** Trivia: pregunta + opciones. Elegir completa la sorpresa. */
export const TriviaRenderer: React.FC<RendererProps> = ({ content, onComplete }) => {
  const [choice, setChoice] = useState<number | null>(null)
  if (content.kind !== "trivia") return null
  const { question, options, correctIndex } = content.payload

  const pick = (i: number) => {
    if (choice !== null) return
    setChoice(i)
    onComplete({ choice: i, correct: i === correctIndex })
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-4xl">❓</div>
      <Bilingual value={question} className="space-y-0.5 text-center text-lg font-semibold" />

      <div className="space-y-2">
        {options.es.map((opt, i) => {
          const isCorrect = i === correctIndex
          const isChosen = choice === i
          const decided = choice !== null
          const style = !decided
            ? "border-pink-200 hover:border-rose-400 hover:bg-rose-50"
            : isCorrect
              ? "border-green-400 bg-green-50"
              : isChosen
                ? "border-red-300 bg-red-50"
                : "border-pink-100 opacity-60"
          return (
            <motion.button
              key={i}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={decided ? undefined : { scale: 1.01 }}
              onClick={() => pick(i)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm font-medium transition-colors ${style}`}
            >
              <span>
                {opt}
                {options.en[i] && options.en[i] !== opt && (
                  <span className="ml-1 text-xs text-gray-400">· {options.en[i]}</span>
                )}
              </span>
              {decided && isCorrect && <Check className="h-4 w-4 text-green-500" />}
              {decided && isChosen && !isCorrect && <X className="h-4 w-4 text-red-400" />}
            </motion.button>
          )
        })}
      </div>

      {choice !== null && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-semibold">
          {choice === correctIndex ? (
            <span className="text-green-600">¡Correcto! 🎉</span>
          ) : (
            <span className="text-rose-500">¡Casi! La respuesta era la verde.</span>
          )}
        </motion.p>
      )}
    </div>
  )
}
