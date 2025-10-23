// src/hooks/useCoupleMedia.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseService } from '@/lib/SupabaseService'

type CoupleMedia = {
  id: string
  userA: string
  userB: string
  title: string
  ratingA: number | null
  ratingB: number | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * Hook para gestionar la lista de medios compartidos entre una pareja.
 * - Lee con cache (React Query)
 * - Añade con upsert (título único por pareja)
 * - Valora (cada quien solo su columna, validado por trigger)
 */
export function useCoupleMedia(myId?: string, otherId?: string) {
  const qc = useQueryClient()
  const enabled = !!myId && !!otherId

  const { data, isLoading } = useQuery<CoupleMedia[]>({
    queryKey: ['couple_media', myId, otherId],
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: () => SupabaseService.getCoupleMedia(myId!, otherId!),
  })

  const addMutation = useMutation({
    mutationFn: (vars: { title: string; myRating?: number | null }) =>
      SupabaseService.addCoupleMedia({ userId: myId!, otherId: otherId!, title: vars.title, myRating: vars.myRating }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['couple_media', myId, otherId] }),
  })

  const rateMutation = useMutation({
    mutationFn: (vars: { id: string; rating: number }) =>
      SupabaseService.rateCoupleMedia({ id: vars.id, userId: myId!, rating: vars.rating }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['couple_media', myId, otherId] }),
  })

  return {
    media: data ?? [],
    loading: isLoading,
    addMedia: addMutation.mutateAsync,
    rateMedia: rateMutation.mutateAsync,
  }
}
