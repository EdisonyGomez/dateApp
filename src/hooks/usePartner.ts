// src/hooks/usePartner.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'

export const usePartner = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['partner', user?.id],
    queryFn: async () => {
      if (!user) return null
      // 1 sola consulta que trae todo lo necesario
      const { data, error } = await supabase
        .from('profiles')
        .select('partner_id, partner:partner_id ( id, name )')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      return data?.partner ?? null // { id, name } | null
    },
    enabled: !!user // no se ejecuta hasta que haya usuario
  })
}
