import { Session, User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string;
  email?: string;
  name: string;
  partnerId?: string;
  createdAt: Date;
  avatar_url?: string | null;
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
  createdAt: string
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
  id: string
  birthday?: string
  meet_date?: string
  chinese_day?: string
  profession?: string
  languages?: string[]
  favorite_foods?: string[]
  hobbies?: string[]
  favorite_music?: string
  favorite_songs?: string[]
  favorite_movies?: string[]
}


export interface GameQuestion {
  id: string
  question: string
  category: 'deep' | 'fun' | 'memory' | 'future' | 'intimate'
  created_at?: string
  created_by?: string
  is_active?: boolean
}

export interface GameStreak {
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string
  totalQuestionsAnswered: number
}

export interface GameResponse {
  id: string
  question_id: string
  question: string
  answer: string
  date: string
  category: string
  user_id: string
  created_at: string
  is_private: boolean
  profiles: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface GameReaction {
  id: string
  response_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface DailyQuestion {
  id: string
  question_id: string
  date: string
  created_at: string
  game_questions: GameQuestion
}

export interface GameStats {
  currentStreak: number
  longestStreak: number
  totalQuestionsAnswered: number
  lastPlayedDate: string
}

export type CategoryColors = Record<GameQuestion['category'], string>
export type CategoryEmojis = Record<GameQuestion['category'], string>

export interface ReactionSummary {
  emoji: string
  count: number
  reacted: boolean
}