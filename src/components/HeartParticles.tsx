// src/components/HeartParticles.tsx
import React from 'react'
import { motion } from 'framer-motion'

const generateHearts = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const size = 12 + Math.random() * 20
    const left = Math.random() * 100
    const duration = 6 + Math.random() * 6
    const delay = Math.random() * 5
    const emoji = ['❤️', '💖', '💘', '💞'][Math.floor(Math.random() * 4)]

    return (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${left}%`, fontSize: `${size}px` }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: -200, opacity: [0, 1, 0] }}
        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.div>
    )
  })
}

export const HeartParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {generateHearts(12)}
    </div>
  )
}
