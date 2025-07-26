// lib/gameConstants.ts
import { CategoryColors, CategoryEmojis } from '@/types'

export const categoryColors: CategoryColors = {
  deep: 'bg-purple-100 text-purple-800',
  fun: 'bg-yellow-100 text-yellow-800',
  memory: 'bg-blue-100 text-blue-800',
  future: 'bg-green-100 text-green-800',
  intimate: 'bg-pink-100 text-pink-800'
}

export const categoryEmojis: CategoryEmojis = {
  deep: '🤔',
  fun: '😄',
  memory: '💭',
  future: '🔮',
  intimate: '💕'
}

export const REACTION_EMOJIS = ['❤️', '😆', '😮', '😢', '👏'] as const

export const GAME_CONFIG = {
  STREAK_TARGET: 30,
  CHECK_INTERVAL_MS: 60000, // 1 minuto
} as const