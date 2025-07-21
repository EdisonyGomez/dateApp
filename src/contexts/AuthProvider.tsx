import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

// Tipos para tu tabla profiles
interface Profile {
  partner_id: string | null
  name: string
}

// Lo que expondrás como pareja al resto de la app
interface Partner {
  id: string
  name: string
}

interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  partner: Partner | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // 1️⃣ Inicializa sesión y suscripción
  useEffect(() => {
    // Obtén sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    // Escucha cambios de auth
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2️⃣ Fetch del perfil propio (tiene partner_id y name)
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('partner_id,name')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: Infinity
  })

  // 3️⃣ Fetch del perfil de la pareja (solo si hay partner_id)
  const { data: partner } = useQuery<Partner | null>({
    queryKey: ['partner', profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name')
        .eq('id', profile!.partner_id!)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: Infinity
  })

  // 4️⃣ Métodos de autenticación
  const signUp = async (
    email: string,
    password: string,
    name: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        partner: partner ?? null,
        loading,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
