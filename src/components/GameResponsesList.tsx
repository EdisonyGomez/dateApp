// components/GameResponsesList.tsx
import React from 'react'
import { GameResponse, ReactionSummary } from '@/types'
import { categoryColors, categoryEmojis, REACTION_EMOJIS } from '@/lib/gameConstants'
import { UserAvatar } from './UserAvatar'

interface GameResponsesListProps {
  responses: GameResponse[]
  reactions: Record<string, ReactionSummary[]>
  onToggleReaction: (responseId: string, emoji: string) => void
}

export const GameResponsesList: React.FC<GameResponsesListProps> = ({
  responses,
  reactions,
  onToggleReaction
}) => {
  if (responses.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No responses yet. Start by answering today's question! 💭</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">Past Questions Discussed</h3>
      <ul className="space-y-3">
        {responses.map((response) => {
          // Validación de seguridad para evitar errores
          const profileName = response.profiles?.name || 'Unknown User'
          const profileAvatar = response.profiles?.avatar_url || null
          
          return (
            <li key={response.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar
                  name={profileName}
                  avatarUrl={profileAvatar}
                  size="sm"
                />
                <div className="text-sm text-muted-foreground">
                  Answered by <strong>{profileName}</strong> on{' '}
                  {new Date(response.date).toLocaleDateString()}
                </div>
              </div>

              <p className="text-md font-medium mt-1">{response.question}</p>
              
              {response.answer && (
                <p className="text-sm text-gray-700 mt-2 border-t pt-2 italic">
                  📝 {response.answer}
                </p>
              )}

              {/* Reacciones existentes */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(reactions[response.id] || []).map(r => (
                  <button
                    key={r.emoji}
                    onClick={() => onToggleReaction(response.id, r.emoji)}
                    className={`text-lg px-2 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                      r.reacted ? 'bg-pink-100 border-pink-300' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {r.emoji} <span className="text-xs">{r.count}</span>
                  </button>
                ))}

                {/* Botones para nuevas reacciones */}
                {REACTION_EMOJIS.map(emoji => {
                  const existing = reactions[response.id]?.find(r => r.emoji === emoji)
                  if (existing) return null // Ya está mostrado arriba
                  
                  return (
                    <button
                      key={emoji}
                      onClick={() => onToggleReaction(response.id, emoji)}
                      className="text-lg px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>

              {/* Categoría */}
              <span
                className={`text-xs inline-block mt-3 px-2 py-1 rounded-full capitalize ${
                  categoryColors[response.category as keyof typeof categoryColors]
                }`}
              >
                {categoryEmojis[response.category as keyof typeof categoryEmojis]} {response.category}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}