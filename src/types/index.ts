import { Session, User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  createdAt: Date;
}

export interface DiaryEntry {
  id: string
  userId: string
  date: string
  title: string
  content: string
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'stressed' | 'grateful' | 'neutral'
  isPrivate: boolean
  photos: string[]
  createdAt: Date
  updatedAt: Date
  profiles?: {
    id: string
    name: string
    avatar_url?: string | null
  }
}


// Lo que expondrás como pareja al resto de la app
export interface Partner {
  id: string
  name: string
}


export interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  partner: Partner | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  profile?: Profile | null 

}

export interface Profile {
  partner_id: string | null
  name: string
  avatar_url?: string | null
}
