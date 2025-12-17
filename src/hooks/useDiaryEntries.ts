// src/hooks/useDiaryEntries.ts
import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { DiaryEntry } from "@/types"
import { SupabaseService } from "@/lib/SupabaseService"

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
 * - refreshEntries() fuerza refetch inmediato (sin recargar la página)
 */
export const useDiaryEntries = () => {
  const { user, partner } = useAuth()
  const qc = useQueryClient()

  /**
   * QueryKey único y estable para el diario de la pareja.
   * Evita repetir arrays “a mano” en todo el hook.
   */
  const queryKey = useMemo(
    () => ["diary_entries", user?.id ?? null, partner?.id ?? null] as const,
    [user?.id, partner?.id]
  )

  // ========= QUERY =========
  const { data, isLoading, isFetching } = useQuery<DiaryEntryWithProfile[]>({
    queryKey,
    enabled: !!user?.id, // no dispares hasta tener usuario
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    // La service ya debe hacer el join y ordenar por fecha desc
    queryFn: async () => SupabaseService.getDiaryEntries(user!.id, partner?.id),

    select: (rows) =>
      // Asegura orden descendente por fecha por si el service no lo hace
      [...(rows ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
  })

  const entries = data ?? []

  // ========= MUTACIONES =========
  const addMutation = useMutation({
    mutationFn: (entry: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt">) =>
      SupabaseService.createDiaryEntry(entry),

    onMutate: async (newEntry) => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(queryKey) ?? []

      // Optimistic: añade shadow hasta que llegue el id real
      const optimistic: DiaryEntryWithProfile = {
        ...(newEntry as DiaryEntryWithProfile),
        id: `optimistic-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date(),
        profiles:
          newEntry.userId === user?.id
            ? {
                id: user!.id,
                name: user!.user_metadata?.name ?? user!.email ?? "Yo",
                avatar_url: null,
              }
            : entries.find((e) => e.userId !== user?.id)?.profiles ?? null,
      }

      qc.setQueryData(queryKey, [optimistic, ...prev])
      return { prev }
    },

    onError: (_e, _newEntry, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DiaryEntry> }) =>
      SupabaseService.updateDiaryEntry(id, updates),

    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(queryKey) ?? []

      qc.setQueryData<DiaryEntryWithProfile[]>(
        queryKey,
        prev.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
        )
      )

      return { prev }
    },

    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupabaseService.deleteDiaryEntry(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<DiaryEntryWithProfile[]>(queryKey) ?? []

      qc.setQueryData<DiaryEntryWithProfile[]>(
        queryKey,
        prev.filter((e) => e.id !== id)
      )

      return { prev }
    },

    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  // ========= HELPERS =========
  /**
   * Normaliza fecha a YYYY-MM-DD para comparaciones consistentes.
   */
  const normalizeDate = (date: string | Date) =>
    new Date(date).toISOString().split("T")[0]

  /**
   * Obtiene una entrada por fecha y usuario (por defecto el usuario actual).
   */
  const getEntryByDate = (date: string, uid?: string) =>
    entries.find(
      (e) =>
        normalizeDate(e.date) === normalizeDate(date) &&
        e.userId === (uid ?? user!.id)
    )

  /**
   * Refresca manualmente las entradas desde Supabase SIN recargar la página.
   * - refetchQueries fuerza el fetch inmediato aunque haya staleTime.
   */
  const refreshEntries = async () => {
    if (!user?.id) return
    await qc.refetchQueries({ queryKey, type: "active" })
  }

  return {
    entries,
    loading: isLoading,
    refreshing: isFetching, // ✅ útil para deshabilitar botón/spinner
    addEntry: addMutation.mutateAsync,
    updateEntry: (id: string, updates: Partial<DiaryEntry>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteEntry: deleteMutation.mutateAsync,
    getEntryByDate,
    refreshEntries,
  }
}
