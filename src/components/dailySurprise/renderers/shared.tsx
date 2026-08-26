import type React from "react"
import type { Bi, DailyContent, LearningLanguage } from "@/lib/dailySurprise/types"

/** Props que recibe cada renderer de contenido. */
export interface RendererProps {
  content: DailyContent
  completed: boolean
  onComplete: (result?: Record<string, unknown>) => void
  learningLanguage: LearningLanguage | null
  setLearningLanguage: (l: LearningLanguage) => void
}

/** Muestra texto bilingüe: español arriba, inglés como apoyo. */
export const Bilingual: React.FC<{ value: Bi; className?: string }> = ({ value, className }) => (
  <div className={className}>
    <p className="text-gray-800">{value.es}</p>
    <p className="text-sm text-gray-400">{value.en}</p>
  </div>
)
