import type React from "react"
import { motion } from "framer-motion"
import type { RendererProps } from "./shared"

/** Mensaje motivacional / de amor (pasivo). */
export const MessageRenderer: React.FC<RendererProps> = ({ content }) => {
  if (content.kind !== "message") return null
  const { text, author } = content.payload
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 text-center"
    >
      <div className="text-5xl">💌</div>
      <p className="text-xl font-semibold leading-snug text-gray-800">“{text.es}”</p>
      <p className="text-sm italic text-gray-400">“{text.en}”</p>
      {author && <p className="text-xs font-medium text-rose-400">— {author}</p>}
    </motion.div>
  )
}

/** ¿Sabías que...? (pasivo). */
export const FactRenderer: React.FC<RendererProps> = ({ content }) => {
  if (content.kind !== "fact") return null
  const { text } = content.payload
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3 text-center"
    >
      <motion.div
        className="text-5xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        💡
      </motion.div>
      <p className="text-lg font-semibold text-gray-800">{text.es}</p>
      <p className="text-sm text-gray-400">{text.en}</p>
    </motion.div>
  )
}

/** Imagen / postal (pasivo). */
export const ImageRenderer: React.FC<RendererProps> = ({ content }) => {
  if (content.kind !== "image") return null
  const { url, caption } = content.payload
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 text-center">
      <img src={url} alt={caption.es} className="mx-auto max-h-64 rounded-2xl object-contain shadow-sm" />
      <p className="font-medium text-gray-800">{caption.es}</p>
      <p className="text-sm text-gray-400">{caption.en}</p>
    </motion.div>
  )
}
