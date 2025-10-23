// src/lib/SupabaseService.ts
import { DiaryEntry, User } from '@/types'
import { supabase } from './supabase'


// Ordena la pareja de forma estable para unicidad (a < b)
function sortPair(a: string, b: string): { user_a: string; user_b: string } {
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a }
}

export class SupabaseService {
  /* ──────────────── AUTH / PERFILES ──────────────── */
  static async signUp(email: string, password: string, name: string) {
    const { data: auth, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // crea perfil
    await supabase.from('profiles').insert({
      id: auth.user.id,
      email,
      name
    })
    return auth.user
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  static async linkPartners(userId: string, partnerId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ partner_id: partnerId })
      .eq('id', userId)
    if (error) throw error
  }

  /* ──────────────── ENTRADAS DIARIO ──────────────── */
  /* ─────── crear entrada ─────── */
  static async createDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    const { userId, isPrivate, ...rest } = entry
    const insertData = {
      user_id: userId,
      is_private: isPrivate,
      ...rest
    }
    const { data, error } = await supabase
      .from('diary_entries')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return SupabaseService.toCamel(data)
  }

  /* ─────── actualizar entrada ─────── */
  static async updateDiaryEntry(id: string, updates: Partial<DiaryEntry>) {
    const snakeUpdates: any = {}
    if (updates.isPrivate !== undefined) snakeUpdates.is_private = updates.isPrivate
    if (updates.title) snakeUpdates.title = updates.title
    if (updates.content) snakeUpdates.content = updates.content
    if (updates.date) snakeUpdates.date = updates.date
    if (updates.mood) snakeUpdates.mood = updates.mood
    if (updates.photos) snakeUpdates.photos = updates.photos
    const { data, error } = await supabase
      .from('diary_entries')
      .update(snakeUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return SupabaseService.toCamel(data)
  }


  static async deleteDiaryEntry(id: string) {
    const { error } = await supabase.from('diary_entries').delete().eq('id', id)
    if (error) throw error
  }

  /* ─────── obtener entradas ─────── */
  static async getDiaryEntries(userId: string, partnerId?: string) {
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
      id,
      content,
      date,
      mood,
      title,
      created_at,
      updated_at,
      is_private,
      user_id,
      photos,
      profiles (
        id,
        name,
        avatar_url
      )
    `)
      .or(`user_id.eq.${userId},user_id.eq.${partnerId ?? '00000000-0000-0000-0000-000000000000'}`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(SupabaseService.toCamel);
  }

  /* ──────────────── FOTOS ──────────────── */
  static async uploadPhoto(file: File, userId: string) {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase
      .storage
      .from('diary-photos')
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('diary-photos').getPublicUrl(path)
    return data.publicUrl
  }

  /* ─────── util: snake → camel ─────── */
  private static toCamel(row: any): DiaryEntry {
    return {
      ...row,
      userId: row.user_id,
      isPrivate: row.is_private
    }
  }


      // ===== Couple Media =====

  static async getCoupleMedia(userId: string, otherId: string) {
    const { user_a, user_b } = sortPair(userId, otherId)

    const { data, error } = await supabase
      .from('couple_media')
      .select('*')
      .eq('user_a', user_a)
      .eq('user_b', user_b)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((row: any) => ({
      id: row.id,
      userA: row.user_a,
      userB: row.user_b,
      title: row.title,
      ratingA: row.rating_a,
      ratingB: row.rating_b,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  static async addCoupleMedia(params: { userId: string; otherId: string; title: string; myRating?: number | null }) {
    const { user_a, user_b } = sortPair(params.userId, params.otherId)
    const isA = params.userId === user_a

    const payload: any = {
      user_a,
      user_b,
      title: params.title.trim(),
      created_by: params.userId,
      rating_a: isA ? (params.myRating ?? null) : null,
      rating_b: !isA ? (params.myRating ?? null) : null,
    }

    const { data, error } = await supabase
      .from('couple_media')
      .upsert(payload, {
        onConflict: 'user_a,user_b,title',
        ignoreDuplicates: false,
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: data.id,
      userA: data.user_a,
      userB: data.user_b,
      title: data.title,
      ratingA: data.rating_a,
      ratingB: data.rating_b,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  static async rateCoupleMedia(params: { id: string; userId: string; rating: number }) {
    // Primero identificamos si el usuario es A o B
    const { data: row, error: errGet } = await supabase
      .from('couple_media')
      .select('id, user_a, user_b')
      .eq('id', params.id)
      .single()

    if (errGet) throw errGet

    const isA = params.userId === row.user_a
    const updatePayload: any = isA ? { rating_a: params.rating } : { rating_b: params.rating }

    const { error } = await supabase
      .from('couple_media')
      .update(updatePayload)
      .eq('id', params.id)

    if (error) throw error
  }


  
}
