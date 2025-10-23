"use client"

// src/components/DiaryEntry.tsx
import type React from "react"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthProvider"
// ⛔️ Eliminado: import { supabase } from "@/lib/supabase"
import type { DiaryEntry as DiaryEntryType } from "@/types"
import { ProfileModal } from "@/pages/ProfileModal"
import { Calendar, Lock, Unlock, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { BookReaderModal } from "@/components/BookReaderModal"

/**
 * Props extendidas para recibir el autor ya resuelto desde el join:
 * Asegúrate que el hook contenedor (useDiaryEntries) haga:
 *   select(..., profiles(id, name, avatar_url))
 */
interface DiaryEntryProps {
  entry: DiaryEntryType & {
    profiles?: { id: string; name: string; avatar_url?: string | null } | null
  }
  onEdit?: (entry: DiaryEntryType) => void
}

/** Mapas de estado de ánimo: UI */
const moodEmojis = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  calm: "😌",
  stressed: "😰",
  grateful: "🙏",
  neutral: "😐",
  cansado: "😴",
  enamorado: "😍",
  aburrido: "😒",
  sorprendido: "😲",
  confundido: "😕",
  ansioso: "😟",
  relajado: "😌",
  nostálgico: "😢",
  motivado: "💪",
  inspirado: "✨",
  frustrado: "😤",
  aliviado: "😌",
  worried: "😟",
  scared: "😨",
  hopeful: "🌟",
  mad: "😠",
  horny: "🔥",
  meh: "😑",
  sleepy: "😴",
  sick: "🤒",
  jealous: "😒",
  proud: "😎",
} as const

const moodColors = {
  happy: "bg-yellow-100 text-yellow-800",
  sad: "bg-blue-100 text-blue-800",
  excited: "bg-orange-100 text-orange-800",
  calm: "bg-green-100 text-green-800",
  stressed: "bg-red-100 text-red-800",
  grateful: "bg-purple-100 text-purple-800",
  neutral: "bg-gray-100 text-gray-800",
  tired: "bg-gray-200 text-gray-800",
  inLove: "bg-pink-100 text-pink-800",
  bored: "bg-gray-300 text-gray-800",
  surprised: "bg-yellow-200 text-yellow-800",
  confused: "bg-blue-200 text-blue-800",
  anxious: "bg-red-200 text-red-800",
  relaxed: "bg-green-200 text-green-800",
  nostalgic: "bg-purple-200 text-purple-800",
  motivated: "bg-orange-200 text-orange-800",
  inspired: "bg-pink-200 text-pink-800",
  frustrated: "bg-red-300 text-red-800",
  relieved: "bg-green-300 text-green-800",
  worried: "bg-blue-300 text-blue-800",
  scared: "bg-red-400 text-red-800",
  hopeful: "bg-purple-300 text-purple-800",
  angry: "bg-red-500 text-red-800",
} as const

type MoodKey = keyof typeof moodEmojis

/**
 * Componente de entrada del diario
 * - Sin side-effects de red: NO llama a supabase
 * - Toma el nombre del autor desde entry.profiles?.name o del usuario actual si es propio
 * - Optimiza render (useMemo) para partes derivadas costosas
 */
export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit }) => {
  const { user } = useAuth()
  const isOwn = entry.userId === user?.id
  const validatedMood = entry.mood as MoodKey

  // Estado UI (paginación/libro)
  // Estado para el modal de libro
  const [isBookOpenModal, setIsBookOpenModal] = useState(false)


  // Derivados
  const pages = useMemo(() => {
    const text = entry.content || ""
    const CHARS_PER_PAGE = 400

    if (!text.trim()) return [""]

    const result: string[] = []
    const paragraphs = text.split(/\n\s*\n/)

    for (const raw of paragraphs) {
      const para = raw.trim()
      if (!para) continue
      if (para.length <= CHARS_PER_PAGE) {
        result.push(para)
        continue
      }
      let start = 0
      while (start < para.length) {
        let end = Math.min(start + CHARS_PER_PAGE, para.length)
        if (end < para.length) {
          const lastSpace = para.lastIndexOf(" ", end - 1)
          if (lastSpace > start + Math.floor(CHARS_PER_PAGE * 0.6)) end = lastSpace
        }
        const slice = para.slice(start, end).trim()
        if (slice) result.push(slice)
        start = end
      }
    }
    return result.length ? result : [text]
  }, [entry.content])



  const totalPages = pages.length
  const hasMultiplePages = totalPages > 1

  const wordCount = useMemo(() => entry.content?.trim()?.split(/\s+/).length ?? 0, [entry.content])
  const readMinutes = Math.max(1, Math.round(wordCount / 210))

  // ✅ Autor sin N+1: propio -> user metadata; ajeno -> profiles.name
  const authorName = useMemo(() => {
    if (isOwn) return user?.user_metadata?.name || user?.email || "Yo"
    return entry.profiles?.name || "Compañero"
  }, [isOwn, user?.user_metadata?.name, user?.email, entry.profiles?.name])

  // Alineación y fecha
  const alignment = isOwn ? "justify-end" : "justify-start"

  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = entry.date.split("-").map(Number)
      const localDate = new Date(y, m - 1, d)
      return localDate.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })
    } catch {
      return entry.date
    }
  }, [entry.date])


  return (
    <div className={cn("flex mb-6", alignment)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "relative flex flex-col max-w-[85%] sm:max-w-lg rounded-2xl shadow-2xl border backdrop-blur-md",
          isOwn
            ? "bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 text-rose-900 border-rose-200"
            : "bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 text-indigo-900 border-indigo-200",
        )}
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${isOwn ? "rgba(244, 63, 94, 0.03)" : "rgba(99, 102, 241, 0.03)"} 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${isOwn ? "rgba(236, 72, 153, 0.03)" : "rgba(79, 70, 229, 0.03)"} 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, ${isOwn ? "rgba(244, 63, 94, 0.01)" : "rgba(99, 102, 241, 0.01)"} 50%, transparent 51%)
          `,
        }}
      >
        {/* Modal de lectura tipo libro */}
        <BookReaderModal
          open={isBookOpenModal}
          onOpenChange={setIsBookOpenModal}
          pages={pages}
          title={entry.title}
          author={authorName}
          dateLabel={formattedDate}
          theme={isOwn ? "own" : "partner"}
        />


        {/* Header de la tarjeta */}
        <div
          className={cn(
            "flex items-center mb-3 p-4 border-b",
            isOwn
              ? "border-rose-200/60 bg-gradient-to-r from-rose-100/50 to-pink-100/50"
              : "border-indigo-200/60 bg-gradient-to-r from-indigo-100/50 to-blue-100/50",
          )}
        >
          <div className="mr-3">
            <ProfileModal
              userId={entry.userId}
              isCurrentUser={isOwn}
              // 👇 pasa el perfil ya venido del join para que el avatar/nombre estén listos
              initialProfile={{
                name: entry.profiles?.name,
                avatar_url: entry.profiles?.avatar_url ?? null,
              }}
              fallbackColor={isOwn ? "bg-rose-200 text-rose-800" : "bg-indigo-200 text-indigo-800"}
            />
          </div>
          <div className="flex-1">
            <h3 className={cn("text-lg font-bold leading-tight font-serif", isOwn ? "text-rose-800" : "text-indigo-800")}>
              {entry.title}
            </h3>
            <div className={cn("text-xs flex items-center gap-1 font-medium", isOwn ? "text-rose-600" : "text-indigo-600")}>
              <Calendar className="h-3 w-3" />
              <span>
                {formattedDate} • {authorName}
              </span>
            </div>
          </div>
          <div className="ml-2">
            <Badge className={cn("text-xs py-1 px-2 font-medium", moodColors[validatedMood])}>
              {moodEmojis[validatedMood]} {validatedMood.charAt(0).toUpperCase() + validatedMood.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Contenido (preview corto) */}
        <div className="px-4 pb-2">
          <div
            className={cn(
              "text-base leading-7 whitespace-pre-wrap tracking-wide font-serif",
              isOwn ? "text-rose-800" : "text-indigo-800",
            )}
          >
            {pages[0].slice(0, 200)}
            {pages[0].length > 200 && "…"}
          </div>
        </div>

        {/* Botón para abrir el libro (modal) */}
        {hasMultiplePages && (
          <div
            className={cn(
              "px-4 pb-3 flex items-center justify-end text-xs",
              isOwn ? "text-rose-700/80" : "text-indigo-700/80",
            )}
          >
            <button
              onClick={() => setIsBookOpenModal(true)}
              className={cn(
                "font-medium transition-colors duration-200 hover:underline",
                isOwn ? "text-rose-600 hover:text-rose-800" : "text-indigo-600 hover:text-indigo-800",
              )}
              aria-label="Abrir libro"
            >
              📖 Abrir libro
            </button>
          </div>
        )}


        {/* Toggle abrir/cerrar libro */}
        {hasMultiplePages && (
          <div
            className={cn(
              "px-4 pb-3 flex items-center justify-end text-xs",
              isOwn ? "text-rose-700/80" : "text-indigo-700/80",
            )}
          >
            
          </div>
        )}

        {/* Fotos */}
        {entry.photos && entry.photos.length > 0 && (
          <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
            {entry.photos.map((photo, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 shadow-md",
                  isOwn ? "border-rose-200" : "border-indigo-200",
                )}
              >
                <img
                  src={photo || "/placeholder.svg"}
                  alt={`Imagen de la entrada ${idx + 1}`}
                  className="object-cover aspect-square w-full h-full"
                  loading="lazy"
                />
                <div className={cn("absolute inset-0 border-4 pointer-events-none", isOwn ? "border-rose-100/50" : "border-indigo-100/50")} />
              </div>
            ))}
          </div>
        )}

        {/* Privacidad y editar */}
        <div className={cn("mx-4 mb-3 flex items-center text-xs", isOwn ? "justify-end" : "justify-start")}>
          {entry.isPrivate ? (
            <Lock className={cn("h-3 w-3 mr-1", isOwn ? "text-rose-500" : "text-indigo-500")} />
          ) : (
            <Unlock className={cn("h-3 w-3 mr-1", isOwn ? "text-rose-500" : "text-indigo-500")} />
          )}
          <span className={cn("font-medium", isOwn ? "text-rose-600" : "text-indigo-600")}>
            {entry.isPrivate ? "Privada" : "Compartida"}
          </span>
        </div>

        {isOwn && onEdit && (
          <div className="mx-4 mb-3 text-xs flex justify-end">
            <button
              onClick={() => onEdit(entry)}
              className={cn(
                "hover:underline flex items-center gap-1 font-medium transition-colors duration-200",
                isOwn ? "text-rose-700 hover:text-rose-900" : "text-indigo-700 hover:text-indigo-900",
              )}
              aria-label="Editar entrada del diario"
            >
              <Edit className="h-3 w-3" /> Editar
            </button>
          </div>
        )}

        {/* Esquinas decorativas */}
        <div className={cn("absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 rounded-tl-lg opacity-60", isOwn ? "border-rose-300" : "border-indigo-300")} />
        <div className={cn("absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 rounded-tr-lg opacity-60", isOwn ? "border-rose-300" : "border-indigo-300")} />
        <div className={cn("absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 rounded-bl-lg opacity-60", isOwn ? "border-rose-300" : "border-indigo-300")} />
        <div className={cn("absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 rounded-br-lg opacity-60", isOwn ? "border-rose-300" : "border-indigo-300")} />
      </motion.div>
    </div>
  )
}
