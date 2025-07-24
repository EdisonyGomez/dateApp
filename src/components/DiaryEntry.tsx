// src/components/DiaryEntry.tsx
import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Heart, Lock, Unlock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DiaryEntry as DiaryEntryType } from '@/types'

interface DiaryEntryProps {
  entry: DiaryEntryType
  onEdit?: (entry: DiaryEntryType) => void
}

const moodEmojis = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  stressed: '😰',
  grateful: '🙏',
  neutral: '😐'
} as const

const moodColors = {
  happy: 'bg-yellow-100 text-yellow-800',
  sad: 'bg-blue-100 text-blue-800',
  excited: 'bg-orange-100 text-orange-800',
  calm: 'bg-green-100 text-green-800',
  stressed: 'bg-red-100 text-red-800',
  grateful: 'bg-purple-100 text-purple-800',
  neutral: 'bg-gray-100 text-gray-800'
} as const

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit }) => {
  const { user } = useAuth()
  const isOwn = entry.userId === user?.id
  const [authorName, setAuthorName] = useState<string>('')

  /* ────── busca nombre del autor (si no es propio) ────── */
  useEffect(() => {
    if (isOwn && user) {
      setAuthorName(user.user_metadata?.name ?? user.email)
      return
    }

    const fetchAuthor = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', entry.userId)
        .single()
      setAuthorName(data?.name || 'Partner')
    }

    fetchAuthor()
  }, [entry.userId, isOwn, user])

  /* ────── utils ────── */
  const initial = authorName.charAt(0).toUpperCase()
  const borderColor = isOwn ? 'border-l-blue-500' : 'border-l-pink-500'

  /* ────── render ────── */
  return (
    <Card className={`mb-4 transition-all hover:shadow-md border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={isOwn ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}>
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{entry.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(entry.date).toLocaleDateString()}
                <span className="mx-2">•</span>
                <span>{authorName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {entry.isPrivate ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge className={moodColors[entry.mood]}>
              {moodEmojis[entry.mood]} {entry.mood}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {entry.content}
          </p>
        </div>

        {entry.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {entry.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`Photo ${idx + 1}`}
                className="rounded-lg object-cover aspect-square"
              />
            ))}
          </div>
        )}

        {isOwn && onEdit && (
          <div className="mt-4 pt-3 border-t">
            <button
              onClick={() => onEdit(entry)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Heart className="h-4 w-4 mr-1" />
              Edit entry
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
