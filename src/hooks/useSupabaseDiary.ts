import { useState, useEffect } from 'react'
import { SupabaseService } from '@/lib/SupabaseService' 
import { DiaryEntry } from '@/types'

export function useDiary(userId: string, partnerId?: string) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SupabaseService.getDiaryEntries(userId, partnerId)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [userId, partnerId])

  return { entries, loading }
}
