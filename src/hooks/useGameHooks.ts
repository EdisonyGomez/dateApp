// hooks/useGameHooks.ts
import { useState, useEffect, useCallback } from 'react'
import { GameService } from '@/lib/GameService'
import { GameStreak, GameResponse, GameReaction, ReactionSummary, DailyQuestion } from '@/types'
import { useAuth } from '@/contexts/AuthProvider'
import { toast } from 'sonner'

// Hook para manejar el streak del juego
export const useGameStreak = () => {
  const { user } = useAuth()
  const [gameStreak, setGameStreak] = useState<GameStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    totalQuestionsAnswered: 0
  })

  useEffect(() => {
    if (!user) return
    
    const stored = localStorage.getItem(`coupleGame_${user.id}`)
    if (stored) {
      const data: GameStreak = JSON.parse(stored)
      setGameStreak(data)
    }
  }, [user])

  const updateStreak = useCallback((date: string) => {
    if (!user) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = gameStreak.currentStreak
    if (gameStreak.lastPlayedDate === yesterdayStr || gameStreak.lastPlayedDate === '') {
      newStreak += 1
    } else if (gameStreak.lastPlayedDate !== date) {
      newStreak = 1
    }

    const updated: GameStreak = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, gameStreak.longestStreak),
      lastPlayedDate: date,
      totalQuestionsAnswered: gameStreak.totalQuestionsAnswered + 1
    }

    setGameStreak(updated)
    localStorage.setItem(`coupleGame_${user.id}`, JSON.stringify(updated))
    toast.success(`Great! Your streak is now ${newStreak} days! 🔥`)
  }, [user, gameStreak])

  return { gameStreak, updateStreak }
}

// Hook para manejar la verificación de pareja
export const usePartnerLink = () => {
  const { user } = useAuth()
  const [partnerLinked, setPartnerLinked] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPartner = async () => {
      if (!user) {
        setPartnerLinked(false)
        setPartnerId(null)
        setLoading(false)
        return
      }

      const isLinked = await GameService.checkPartnerLink(user.id)
      const partnerIdResult = await GameService.getPartnerId(user.id)
      
      setPartnerLinked(isLinked)
      setPartnerId(partnerIdResult)
      setLoading(false)
    }

    checkPartner()
  }, [user])

  return { partnerLinked, partnerId, loading }
}

// Hook para manejar la pregunta diaria
export const useDailyQuestion = () => {
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDailyQuestion = useCallback(async (date: string) => {
    setLoading(true)
    
    let question = await GameService.getDailyQuestion(date)
    
    // Si no existe pregunta para hoy, crear una
    if (!question) {
      question = await GameService.createDailyQuestion(date)
    }
    
    setDailyQuestion(question)
    setLoading(false)
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    loadDailyQuestion(today)
  }, [loadDailyQuestion])

  return { dailyQuestion, loading, loadDailyQuestion }
}

// Hook para verificar si el usuario puede responder
export const useCanAnswer = () => {
  const { user } = useAuth()
  const [canAnswer, setCanAnswer] = useState(true)
  const [loading, setLoading] = useState(true)

  const checkCanAnswer = useCallback(async (date: string) => {
    if (!user) {
      setCanAnswer(false)
      setLoading(false)
      return
    }

    const hasAnswered = await GameService.hasAnsweredToday(user.id, date)
    setCanAnswer(!hasAnswered)
    setLoading(false)
  }, [user])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    checkCanAnswer(today)

    // Verificar cada minuto si es medianoche para resetear
    const interval = setInterval(() => {
      const now = new Date()
      const newToday = now.toISOString().split('T')[0]
      
      if (newToday !== today) {
        checkCanAnswer(newToday)
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(interval)
  }, [checkCanAnswer])

  return { canAnswer, loading, checkCanAnswer }
}

// Hook para manejar respuestas del juego
export const useGameResponses = () => {
  const { user } = useAuth()
  const { partnerId } = usePartnerLink()
  const [responses, setResponses] = useState<GameResponse[]>([])
  const [loading, setLoading] = useState(true)

  const loadResponses = useCallback(async () => {
    if (!user || !partnerId) {
      setResponses([])
      setLoading(false)
      return
    }

    try {
      const data = await GameService.getCoupleResponses(user.id, partnerId)
      console.log('Loaded responses:', data) // Para debug
      setResponses(data)
    } catch (error) {
      console.error('Error loading responses:', error)
      setResponses([])
    } finally {
      setLoading(false)
    }
  }, [user, partnerId])

  const addResponse = useCallback((response: GameResponse) => {
    // Verificar que la respuesta tenga la información necesaria
    if (response && response.profiles && response.profiles.name) {
      setResponses(prev => [response, ...prev])
    } else {
      console.warn('Attempted to add response without valid profile data:', response)
    }
  }, [])

  useEffect(() => {
    loadResponses()
  }, [loadResponses])

  return { responses, loading, loadResponses, addResponse }
}

// Hook para manejar reacciones
export const useReactions = (responses: GameResponse[]) => {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<Record<string, ReactionSummary[]>>({})

  const loadReactions = useCallback(async () => {
    if (!user || responses.length === 0) return

    const responseIds = responses.map(r => r.id)
    const reactionData = await GameService.getReactions(responseIds)

    const grouped: Record<string, ReactionSummary[]> = {}

    for (const res of responses) {
      const responseReactions = reactionData.filter(r => r.response_id === res.id)
      const byEmoji: Record<string, { count: number; reacted: boolean }> = {}

      for (const r of responseReactions) {
        if (!byEmoji[r.emoji]) {
          byEmoji[r.emoji] = { count: 0, reacted: false }
        }
        byEmoji[r.emoji].count += 1
        if (r.user_id === user.id) byEmoji[r.emoji].reacted = true
      }

      grouped[res.id] = Object.entries(byEmoji).map(([emoji, val]) => ({
        emoji,
        count: val.count,
        reacted: val.reacted
      }))
    }

    setReactions(grouped)
  }, [user, responses])

  const toggleReaction = useCallback(async (responseId: string, emoji: string) => {
    if (!user) return

    const existing = reactions[responseId]?.find(r => r.emoji === emoji && r.reacted)

    const success = existing 
      ? await GameService.removeReaction(responseId, user.id, emoji)
      : await GameService.addReaction(responseId, user.id, emoji)

    if (success) {
      setReactions(prev => {
        const current = prev[responseId] || []
        
        if (existing) {
          // Remove reaction
          return {
            ...prev,
            [responseId]: current
              .map(r => r.emoji === emoji 
                ? { ...r, count: r.count - 1, reacted: false }
                : r
              )
              .filter(r => r.count > 0)
          }
        } else {
          // Add reaction
          const found = current.find(r => r.emoji === emoji)
          if (found) {
            return {
              ...prev,
              [responseId]: current.map(r => r.emoji === emoji 
                ? { ...r, count: r.count + 1, reacted: true }
                : r
              )
            }
          } else {
            return {
              ...prev,
              [responseId]: [...current, { emoji, count: 1, reacted: true }]
            }
          }
        }
      })
    }
  }, [user, reactions])

  useEffect(() => {
    loadReactions()
  }, [loadReactions])

  return { reactions, toggleReaction, loadReactions }
}