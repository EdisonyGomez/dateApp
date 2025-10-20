// components/GameResponsesList.tsx
import React, { useState } from 'react'
import { GameResponse, ReactionSummary, RepliesByResponseId } from '@/types'
import { categoryColors, categoryEmojis, REACTION_EMOJIS } from '@/lib/gameConstants'
import { UserAvatar } from './UserAvatar'
import { MessageSquarePlus, Send } from 'lucide-react'
import { Button } from './ui/button'

interface GameResponsesListProps {
  responses: GameResponse[]
  reactions: Record<string, ReactionSummary[]>
  onToggleReaction: (responseId: string, emoji: string) => void
  // NUEVO:
  repliesByResponse: RepliesByResponseId
  onAddReply: (responseId: string, content: string, isPrivate?: boolean) => Promise<void> | void

}


export const GameResponsesList: React.FC<GameResponsesListProps> = ({
  responses,
  reactions,
  onToggleReaction,
  repliesByResponse,
  onAddReply,
}) => {
  const [composerOpen, setComposerOpen] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const toggleComposer = (responseId: string) => {
    setComposerOpen((prev) => ({ ...prev, [responseId]: !prev[responseId] }))
  }
  const submitReply = async (responseId: string) => {
    const text = drafts[responseId]?.trim()
    if (!text) return
    await onAddReply(responseId, text, false)
    setDrafts((prev) => ({ ...prev, [responseId]: '' }))
    setComposerOpen((prev) => ({ ...prev, [responseId]: false }))
  }

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
          const replies = repliesByResponse[response.id] ?? []

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
                    className={`text-lg px-2 py-1 rounded-full border flex items-center gap-1 transition-colors ${r.reacted ? 'bg-pink-100 border-pink-300' : 'bg-white hover:bg-gray-50'
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
                className={`text-xs inline-block mt-3 px-2 py-1 rounded-full capitalize ${categoryColors[response.category as keyof typeof categoryColors]
                  }`}
              >
                {categoryEmojis[response.category as keyof typeof categoryEmojis]} {response.category}
              </span>



              {/* Sección de réplicas (thread) */}
        <div className="mt-3 border-t pt-3 space-y-3">
          {/* Botón para abrir composer */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {replies.length > 0 ? `${replies.length} respuesta${replies.length > 1 ? 's' : ''}` : 'Sin respuestas aún'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleComposer(response.id)}>
              <MessageSquarePlus className="h-4 w-4 mr-1" />
              Responder
            </Button>
          </div>

          {/* Composer */}
          {composerOpen[response.id] && (
            <div className="rounded-lg bg-gray-50 p-3 border">
              <textarea
                value={drafts[response.id] ?? ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [response.id]: e.target.value }))}
                placeholder="Escribe tu respuesta..."
                className="w-full p-2 border rounded-md min-h-[60px] resize-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleComposer(response.id)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => submitReply(response.id)}>
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de réplicas */}
          {replies.length > 0 && (
            <div className="space-y-2">
              {replies.map((rep) => (
                <div key={rep.id} className="flex items-start gap-3">
                <UserAvatar
                  name={profileName}
                  avatarUrl={profileAvatar}
                  size="sm"
                />
                  <div className="bg-white border rounded-lg p-2 flex-1">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{rep.content}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(rep.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
 



            </li>
          )
        })}
      </ul>
    </div>
  )
}