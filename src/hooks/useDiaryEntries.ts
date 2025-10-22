// src/hooks/useDiaryEntries.ts
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DiaryEntry } from '@/types'
import { SupabaseService } from '@/lib/SupabaseService'

/**
 * Tipo extendido para incluir el autor resuelto desde el join.
 * NOTA: Mantiene compatibilidad con tu componente (entry.profiles?.name).
 */
export type DiaryEntryWithProfile = DiaryEntry & {
  profiles?: { id: string; name: string; avatar_url?: string | null } | null
}

/**
 * Hook de entradas del diario
 * - 1 sola query con join a profiles (evita N+1)
 * - cache con React Query
 * - mutaciones con optimistic update e invalidación puntual
 */
export const useDiaryEntries = () => {
  const { user, partner } = useAuth()
  const qc = useQueryClient()

  // ========= QUERY =========
  const { data, isLoading } = useQuery<DiaryEntryWithProfile[]>({
    queryKey: ['diary_entries', user?.id, partner?.id ?? null],
    enabled: !!user?.id, // no dispares hasta tener usuario
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // La service ya debe hacer el join y ordenar por fecha desc
    queryFn: async () =>
      SupabaseService.getDiaryEntries(user!.id, partner?.id ),
    select: (rows) =>
      // Asegura orden descendente por fecha por si el service no lo hace
      [...(rows ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
  })

  const entries = data ?? []

  // ========= MUTACIONES =========
  const addMutation = useMutation({
    mutationFn: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      SupabaseService.createDiaryEntry(entry),
    onMutate: async (newEntry) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(key) ?? []

      // Optimistic: añade shadow hasta que llegue el id real
      const optimistic: DiaryEntryWithProfile = {
        ...(newEntry as DiaryEntryWithProfile),
        id: `optimistic-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date(),
        profiles: newEntry.userId === user?.id
          ? { id: user!.id, name: user!.user_metadata?.name ?? user!.email ?? 'Yo', avatar_url: null }
          : entries.find(e => e.userId !== user?.id)?.profiles ?? null,
      }

      qc.setQueryData(key, [optimistic, ...prev])
      return { prev }
    },
    onError: (_e, _newEntry, ctx) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      qc.invalidateQueries({ queryKey: key })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DiaryEntry> }) =>
      SupabaseService.updateDiaryEntry(id, updates),
    onMutate: async ({ id, updates }) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(key) ?? []
      qc.setQueryData<DiaryEntryWithProfile[]>(
        key,
        prev.map(e => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e))
      )
      return { prev }
    },
    onError: (_e, _vars, ctx) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      qc.invalidateQueries({ queryKey: key })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupabaseService.deleteDiaryEntry(id),
    onMutate: async (id) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(key) ?? []
      qc.setQueryData<DiaryEntryWithProfile[]>(
        key,
        prev.filter(e => e.id !== id)
      )
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      const key = ['diary_entries', user?.id, partner?.id ?? null]
      qc.invalidateQueries({ queryKey: key })
    },
  })

  // ========= HELPERS =========
  const normalizeDate = (date: string | Date) =>
    new Date(date).toISOString().split('T')[0]

  const getEntryByDate = (date: string, uid?: string) =>
    entries.find(
      (e) =>
        normalizeDate(e.date) === normalizeDate(date) &&
        e.userId === (uid ?? user!.id)
    )

  const loading = isLoading

  return {
    entries,
    loading,
    addEntry: addMutation.mutateAsync,
    updateEntry: (id: string, updates: Partial<DiaryEntry>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteEntry: deleteMutation.mutateAsync,
    getEntryByDate,
    refreshEntries: () =>
      // pull-to-refresh manual cuando lo necesites
      qc.invalidateQueries({ queryKey: ['diary_entries', user?.id, partner?.id ?? null] }),
  }
}
