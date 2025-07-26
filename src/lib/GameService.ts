// lib/GameService.ts
import { supabase } from './supabase'
import { GameQuestion, GameResponse, GameReaction, DailyQuestion } from '@/types'

export class GameService {
  // Verificar si el usuario tiene pareja vinculada
  static async checkPartnerLink(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error checking partner link:', error)
      return false
    }
    
    return !!data?.partner_id
  }

  // Obtener el ID de la pareja
  static async getPartnerId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error getting partner ID:', error)
      return null
    }
    
    return data?.partner_id || null
  }

  // Crear una nueva pregunta personalizada
  static async createCustomQuestion(question: GameQuestion): Promise<GameQuestion | null> {
    const { data, error } = await supabase
      .from('game_questions')
      .insert({
        question: question.question,
        category: question.category,
        created_by: question.created_by,
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating question:', error)
      return null
    }
    
    return data
  }

  // Obtener todas las preguntas activas
  static async getAllQuestions(): Promise<GameQuestion[]> {
    const { data, error } = await supabase
      .from('game_questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching questions:', error)
      return []
    }
    
    return data || []
  }

  // Obtener la pregunta del día
  static async getDailyQuestion(date: string): Promise<DailyQuestion | null> {
    const { data, error } = await supabase
      .from('daily_questions')
      .select(`
        id,
        question_id,
        date,
        created_at,
        game_questions!inner (
          id,
          question,
          category,
          created_by,
          is_active
        )
      `)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching daily question:', error)
      return null
    }

    if (!data) return null
    
    // Convertir el array de Supabase a objeto único
    const gameQuestions = Array.isArray(data.game_questions) 
      ? data.game_questions[0] 
      : data.game_questions

    return {
      id: data.id,
      question_id: data.question_id,
      date: data.date,
      created_at: data.created_at,
      game_questions: gameQuestions
    }
  }

  // Crear pregunta del día (solo si no existe)
  static async createDailyQuestion(date: string): Promise<DailyQuestion | null> {
    // Primero verificar si ya existe
    const existing = await this.getDailyQuestion(date)
    if (existing) return existing

    // Obtener una pregunta aleatoria
    const questions = await this.getAllQuestions()
    if (questions.length === 0) return null

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

    try {
      const { data, error } = await supabase
        .from('daily_questions')
        .insert({
          question_id: randomQuestion.id,
          date: date
        })
        .select(`
          id,
          question_id,
          date,
          created_at,
          game_questions!inner (
            id,
            question,
            category,
            created_by,
            is_active
          )
        `)
        .single()
      
      if (error) {
        console.error('Error creating daily question:', error)
        
        // Si falla por RLS, intentar usar la función de base de datos
        if (error.code === '42501') {
          console.log('Attempting to use database function...')
          const { error: funcError } = await supabase.rpc('create_daily_question_if_not_exists')
          
          if (funcError) {
            console.error('Database function also failed:', funcError)
            return null
          }
          
          // Intentar obtener la pregunta creada por la función
          return await this.getDailyQuestion(date)
        }
        
        return null
      }

      if (!data) return null
      
      // Convertir el array de Supabase a objeto único
      const gameQuestions = Array.isArray(data.game_questions) 
        ? data.game_questions[0] 
        : data.game_questions

      return {
        id: data.id,
        question_id: data.question_id,
        date: data.date,
        created_at: data.created_at,
        game_questions: gameQuestions
      }
    } catch (error) {
      console.error('Unexpected error creating daily question:', error)
      return null
    }
  }

  // Verificar si el usuario ya respondió hoy
  static async hasAnsweredToday(userId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('game_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if answered today:', error)
      return false
    }
    
    return !!data
  }

  // Guardar respuesta del juego
  static async saveGameResponse(response: Omit<GameResponse, 'id' | 'created_at' | 'profiles'>): Promise<GameResponse | null> {
    const { data, error } = await supabase
      .from('game_responses')
      .insert(response)
      .select(`
        id,
        question_id,
        question,
        answer,
        date,
        category,
        user_id,
        created_at,
        is_private,
        profiles!inner (
          id,
          name,
          avatar_url
        )
      `)
      .single()
    
    if (error) {
      console.error('Error saving game response:', error)
      return null
    }

    if (!data) return null
    
    // Convertir el array de Supabase a objeto único
    const profiles = Array.isArray(data.profiles) 
      ? data.profiles[0] 
      : data.profiles
    
    // Verificar que tenga información del perfil
    if (!profiles || !profiles.name) {
      console.error('Response saved but profile information is missing')
      return null
    }
    
    return {
      id: data.id,
      question_id: data.question_id,
      question: data.question,
      answer: data.answer,
      date: data.date,
      category: data.category,
      user_id: data.user_id,
      created_at: data.created_at,
      is_private: data.is_private,
      profiles: profiles
    }
  }

  // Obtener respuestas de la pareja
  static async getCoupleResponses(userId: string, partnerId: string): Promise<GameResponse[]> {
    const { data, error } = await supabase
      .from('game_responses')
      .select(`
        id,
        question_id,
        question,
        answer,
        date,
        category,
        user_id,
        created_at,
        is_private,
        profiles!inner (
          id,
          name,
          avatar_url
        )
      `)
      .in('user_id', [userId, partnerId])
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching couple responses:', error)
      return []
    }
    
    if (!data) return []
    
    // Convertir los arrays de Supabase a objetos únicos y filtrar respuestas válidas
    const validResponses = data
      .map(response => {
        const profiles = Array.isArray(response.profiles) 
          ? response.profiles[0] 
          : response.profiles
          
        return {
          id: response.id,
          question_id: response.question_id,
          question: response.question,
          answer: response.answer,
          date: response.date,
          category: response.category,
          user_id: response.user_id,
          created_at: response.created_at,
          is_private: response.is_private,
          profiles: profiles
        }
      })
      .filter(response => response.profiles && response.profiles.name)
    
    return validResponses
  }

  // Obtener reacciones
  static async getReactions(responseIds: string[]): Promise<GameReaction[]> {
    if (responseIds.length === 0) return []

    const { data, error } = await supabase
      .from('game_reactions')
      .select('*')
      .in('response_id', responseIds)
    
    if (error) {
      console.error('Error fetching reactions:', error)
      return []
    }
    
    return data || []
  }

  // Agregar reacción
  static async addReaction(responseId: string, userId: string, emoji: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_reactions')
      .insert({
        response_id: responseId,
        user_id: userId,
        emoji: emoji
      })
    
    if (error) {
      console.error('Error adding reaction:', error)
      return false
    }
    
    return true
  }

  // Remover reacción
  static async removeReaction(responseId: string, userId: string, emoji: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_reactions')
      .delete()
      .eq('response_id', responseId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
    
    if (error) {
      console.error('Error removing reaction:', error)
      return false
    }
    
    return true
  }
}