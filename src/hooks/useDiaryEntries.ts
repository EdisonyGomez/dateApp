// src/hooks/useDiaryEntries.ts
import { useState, useEffect, useCallback } from 'react'
import { DiaryEntry } from '@/types'
import { useAuth } from '@/contexts/AuthProvider'
import { SupabaseService } from '@/lib/SupabaseService'

export const useDiaryEntries = () => {
  const { user, partner } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await SupabaseService.getDiaryEntries(
        user.id,
        partner?.id ?? undefined
      )
      setEntries(
        data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      )
    } finally {
      setLoading(false)
    }
  }, [user, partner])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const addEntry = async (
    entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await SupabaseService.createDiaryEntry(entry)
    await loadEntries()
  }

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>) => {
    await SupabaseService.updateDiaryEntry(id, updates)
    await loadEntries()
  }

  const deleteEntry = async (id: string) => {
    await SupabaseService.deleteDiaryEntry(id)
    await loadEntries()
  }

  const getEntryByDate = (date: string, uid?: string) =>
    entries.find(e => e.date === date && e.userId === (uid ?? user!.id))

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    refreshEntries: loadEntries
  }
}
