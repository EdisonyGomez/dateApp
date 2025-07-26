// src/components/DiaryEntry.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DiaryEntry as DiaryEntryType } from '@/types'
import { ProfileModal } from '@/pages/ProfileModal'
import { Calendar, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

  const alignment = isOwn ? 'justify-end' : 'justify-start'
  const bubbleColor = isOwn ? 'bg-green-100 text-green-900' : 'bg-pink-100 text-pink-900'
  const textAlign = isOwn ? 'text-right' : 'text-left'

  return (
    <div className={`flex ${alignment} mb-6`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative flex flex-col max-w-[80%] sm:max-w-md rounded-3xl ${bubbleColor} shadow-xl p-4 border border-white/50 backdrop-blur-md`}
      >
        {/* Header */}
        <div className="flex items-center mb-2">
          <div className="mr-3">
            <ProfileModal
              userId={entry.userId}
              fallbackColor={isOwn ? 'bg-green-200 text-green-700' : 'bg-pink-200 text-pink-700'}
            />
          </div>
          <div className="flex-1">
            <div className={`text-base font-bold leading-tight ${textAlign}`}>{entry.title}</div>
            <div className={`text-xs text-gray-500 flex items-center gap-1 ${textAlign}`}>
              <Calendar className="h-3 w-3" />
              {new Date(entry.date).toLocaleDateString()} • {authorName}
            </div>
          </div>
          <div className="ml-2">
            <Badge className={`text-xs py-0.5 px-2 ${moodColors[entry.mood]}`}>{moodEmojis[entry.mood]} {entry.mood}</Badge>
          </div>
        </div>

        {/* Content */}
        <p className={`text-sm whitespace-pre-wrap leading-relaxed `}>{entry.content}</p>

        {/* Images */}
        {Array.isArray(entry.photos) && entry.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {entry.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`Photo ${idx + 1}`}
                className="rounded-md object-cover aspect-square"
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`mt-3 flex items-center text-xs ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {entry.isPrivate ? (
            <Lock className="h-3 w-3 text-gray-400 mr-1" />
          ) : (
            <Unlock className="h-3 w-3 text-gray-400 mr-1" />
          )}
          <span className="text-gray-400">{entry.isPrivate ? 'Private' : 'Shared'}</span>
        </div>

        {isOwn && onEdit && (
          <div className="mt-3 text-xs text-right">
            <button
              onClick={() => onEdit(entry)}
              className="text-green-700 hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
