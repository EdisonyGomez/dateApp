/**
 * ───────────────────────────────────────────────
 *  useProfileEditor — carga + edición inline del perfil
 * ───────────────────────────────────────────────
 *  Draft local como fuente de verdad; save hace UPDATE con una lista
 *  blanca de columnas (nunca manda id/partner_id/joins).
 */

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import type { Profile } from "@/types"

const EDITABLE_COLUMNS: (keyof Profile)[] = [
  "name",
  "profession",
  "birthday",
  "meet_date",
  "chinese_day",
  "avatar_url",
  "profile_theme",
  "languages",
  "favorite_foods",
  "hobbies",
  "favorite_music",
  "favorite_songs",
  "favorite_movies",
  "love_story",
  "couple_song",
  "special_places",
  "favorite_activities",
  "dream_destinations",
  "future_goals",
  "love_languages",
  "pet_names",
  "relationship_milestones",
]

export function useProfileEditor(userId: string | undefined, editable: boolean) {
  const { profile: selfProfile } = useAuth()
  const [draft, setDraft] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!userId) return
    let alive = true
    const load = async () => {
      setLoading(true)
      if (editable && selfProfile && selfProfile.id === userId) {
        if (alive) {
          setDraft(selfProfile as Profile)
          setLoading(false)
        }
        return
      }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
      if (error) console.error("profile load error:", error)
      if (alive) {
        setDraft((data as Profile) ?? null)
        setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [userId, editable, selfProfile])

  const setField = useCallback(<K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    if (!draft || !userId) return false
    setSaving(true)
    const payload: Partial<Profile> = {}
    for (const col of EDITABLE_COLUMNS) {
      if (draft[col] !== undefined) (payload as Record<string, unknown>)[col] = draft[col]
    }
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId)
    setSaving(false)
    if (error) {
      console.error("profile save error:", error)
      toast.error("No se pudo guardar el perfil")
      return false
    }
    toast.success("Perfil guardado ✨")
    setDirty(false)
    return true
  }, [draft, userId])

  return { draft, loading, saving, dirty, setField, save }
}
