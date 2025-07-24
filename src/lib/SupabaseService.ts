// src/lib/SupabaseService.ts
import { DiaryEntry, User } from '@/types'
import { supabase } from './supabase'

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
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.${partnerId ?? '00000000-0000-0000-0000-000000000000'}`)
      .order('date', { ascending: false })
    if (error) throw error
    return data.map(SupabaseService.toCamel)
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
}
