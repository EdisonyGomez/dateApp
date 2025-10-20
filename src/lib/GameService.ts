// lib/GameService.ts
import { supabase } from './supabase'
import { GameQuestion, GameResponse, GameReaction, DailyQuestion,GameResponseReply  } from '@/types'

export class GameService {

  // Dentro de export class GameService { ... }
static async answerAndDeactivateQuestion(
  payload: { userId: string; questionId: string; answer: string; dateISO: string }
): Promise<{ responseId: string; questionId: string; deactivated: boolean; createdAt: string }> {
  const { userId, questionId, answer, dateISO } = payload

  const { data, error } = await supabase.rpc("fn_answer_and_deactivate", {
    p_user_id: userId,
    p_question_id: questionId,
    p_answer: answer,
    p_date: dateISO,
  })

  if (error) {
    throw new Error(error.message || "No se pudo guardar la respuesta.")
  }
  if (!data || data.length === 0) {
    throw new Error("Respuesta no registrada. Intenta nuevamente.")
  }

  const row = data[0]
  return {
    responseId: row.response_id,
    questionId: row.question_id,
    deactivated: row.deactivated,
    createdAt: row.created_at,
  }
}




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

  // Verificar si hay preguntas activas disponibles
  static async hasActiveQuestions(): Promise<boolean> {
    const { data, error } = await supabase
      .from('game_questions')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('Error checking active questions:', error)
      return false
    }

    return data && data.length > 0
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

  // Activar una pregunta específica
  static async activateQuestion(questionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_questions')
      .update({ is_active: true })
      .eq('id', questionId)

    if (error) {
      console.error('Error activating question:', error)
      return false
    }

    return true
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

  // Obtener todas las preguntas (activas e inactivas) para reactivación
  static async getAllQuestionsForReactivation(): Promise<GameQuestion[]> {
    const { data, error } = await supabase
      .from('game_questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all questions:', error)
      return []
    }

    return data || []
  }

  static async getDailyQuestion(date: string): Promise<DailyQuestion | null> {
    // Necesitamos el user.id actual; lo pasamos desde el hook (ver abajo)
    throw new Error('Call getDailyQuestionForUser(userId, date) instead');
  }

  static async getDailyQuestionForUser(userId: string, date: string, category?: string): Promise<DailyQuestion | null> {
  const { data, error } = await supabase.rpc('fn_get_or_create_today_question_by_user', {
    p_user_id: userId,
    p_date: date,
    p_category: category ?? null
  })

  if (error) {
    console.error('Error fetching daily question RPC:', error)
    return null
  }
  if (!data || data.length === 0) return null

  const row = data[0]
  const gq = row.game_questions
  if (!gq || gq.is_active !== true) return null

  return {
    id: row.id,
    question_id: row.question_id ?? row.qid,
    date: row.date,
    created_at: row.created_at,
    game_questions: {
      id: gq.id,
      question: gq.question,
      category: gq.category,
      created_at: gq.created_at,
      created_by: gq.created_by,
      is_active: gq.is_active
    }
  }
}


  static async createDailyQuestion(date: string): Promise<DailyQuestion | null> {
    // compat legacy: delega al RPC para el usuario actual
    throw new Error('Use getDailyQuestionForUser(userId, date) which is idempotent.');
  }

  // Verificar si el usuario ya respondió hoy
  static async hasAnsweredToday(userId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('game_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) {
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

    // Desactivar la pregunta para que no se vuelva a mostrar
    try {
      const { error: qErr } = await supabase
        .from('game_questions')
        .update({ is_active: false })
        .eq('id', data.question_id);

      if (qErr) {
        console.error('No se pudo desactivar la pregunta (is_active=false):', qErr);
      }
    } catch (e) {
      console.error('Error inesperado desactivando la pregunta:', e);
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


  /**
   * Crea una réplica (reply) para una respuesta de juego.
   * @param userId     Autor de la réplica (debe ser auth.uid())
   * @param responseId Id de la respuesta a la que se responde
   * @param content    Texto de la réplica
   * @param isPrivate  Si la réplica es privada (opcional, por defecto false)
   * @returns La réplica creada
   */
  static async addReply(params: {
    userId: string
    responseId: string
    content: string
    isPrivate?: boolean
  }): Promise<GameResponseReply> {
    const { userId, responseId, content, isPrivate = false } = params
    const { data, error } = await supabase.rpc('fn_add_response_reply', {
      p_user_id: userId,
      p_response_id: responseId,
      p_content: content,
      p_is_private: isPrivate,
    })

    if (error) {
      console.error('addReply error:', error)
      throw new Error(error.message ?? 'No fue posible agregar la réplica.')
    }
    if (!data || data.length === 0) {
      throw new Error('La RPC no retornó datos.')
    }

    const row = data[0]
    const reply: GameResponseReply = {
      id: row.id,
      response_id: row.response_id,
      user_id: row.user_id,
      content: row.content,
      is_private: row.is_private,
      created_at: row.created_at,
    }
    return reply
  }

  /**
   * Obtiene réplicas para un conjunto de respuestas.
   * @param userId       Usuario autenticado (usado en la RPC para RLS)
   * @param responseIds  Arreglo de ids de respuestas del juego
   * @returns Arreglo de réplicas; puedes mapear a un diccionario en el hook
   */
  static async getRepliesForResponses(params: {
    userId: string
    responseIds: string[]
  }): Promise<GameResponseReply[]> {
    const { userId, responseIds } = params
    if (!responseIds || responseIds.length === 0) return []

    const { data, error } = await supabase.rpc('fn_get_replies_for_responses', {
      p_user_id: userId,
      p_response_ids: responseIds,
    })

    if (error) {
      console.error('getRepliesForResponses error:', error)
      throw new Error(error.message ?? 'No fue posible obtener las réplicas.')
    }

    // data ya devuelve filas de game_response_replies (RLS ya aplicado)
    return (data ?? []) as GameResponseReply[]
  }
  
}



export type AnswerAndDeactivateInput = {
  userId: string
  questionId: string
  answer: string
  dateISO: string // "YYYY-MM-DD"
}

export type AnswerAndDeactivateResult = {
  responseId: string
  questionId: string
  deactivated: boolean
  createdAt: string
}
