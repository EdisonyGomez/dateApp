import type React from "react"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { RendererProps } from "./shared"

const shuffleWord = (w: string): string => {
  const a = w.split("")
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  const out = a.join("")
  return out.toLowerCase() === w.toLowerCase() && w.length > 1 ? shuffleWord(w) : out
}

/** Ordena la palabra. Practica el idioma que el usuario aprende. */
export const ScrambleRenderer: React.FC<RendererProps> = ({ content, onComplete, learningLanguage }) => {
  const [value, setValue] = useState("")
  const [solved, setSolved] = useState(false)
  const [wrong, setWrong] = useState(false)

  const word = content.kind === "scramble" ? (learningLanguage === "en" ? content.payload.word.en : content.payload.word.es) : ""
  const scrambled = useMemo(() => shuffleWord(word), [word])

  if (content.kind !== "scramble") return null
  const { hint } = content.payload

  const check = () => {
    if (value.trim().toLowerCase() === word.toLowerCase()) {
      setSolved(true)
      setWrong(false)
      onComplete({ correct: true })
    } else {
      setWrong(true)
      setTimeout(() => setWrong(false), 500)
    }
  }
  const giveUp = () => {
    setSolved(true)
    setValue(word)
    onComplete({ correct: false })
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">🔤</div>
      <p className="text-sm text-gray-500">
        {hint.es} · {hint.en}
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {scrambled.split("").map((ch, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid h-9 w-9 place-items-center rounded-lg bg-pink-100 text-lg font-bold text-rose-600"
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {!solved ? (
        <motion.div animate={wrong ? { x: [-6, 6, -6, 6, 0] } : {}} className="flex justify-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Tu respuesta…"
            className={`max-w-[12rem] rounded-full text-center ${wrong ? "border-red-400" : "border-pink-200"}`}
          />
          <Button onClick={check} className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500">
            <Check className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xl font-bold text-green-600">
          {word} ✓
        </motion.p>
      )}

      {!solved && (
        <button type="button" onClick={giveUp} className="text-xs text-gray-400 underline">
          Rendirme
        </button>
      )}
    </div>
  )
}
