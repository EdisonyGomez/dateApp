import type React from "react"
import { motion } from "framer-motion"
import { Gift, Check } from "lucide-react"

interface SurpriseBadgeProps {
  onClick: () => void
  completed: boolean
  pending: boolean
}

/** Botón flotante para (re)abrir la sorpresa del día. */
export const SurpriseBadge: React.FC<SurpriseBadgeProps> = ({ onClick, completed, pending }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ scale: 0, y: 20 }}
    animate={{ scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.4 }}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.94 }}
    aria-label="Sorpresa del día"
    className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30"
  >
    {completed ? <Check className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
    {pending && (
      <motion.span
        className="absolute inset-0 rounded-full ring-2 ring-rose-300"
        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
      />
    )}
    {pending && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" />}
  </motion.button>
)
