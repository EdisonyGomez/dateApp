"use client"

// src/components/DiaryEntry.tsx
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthProvider"
import { supabase } from "@/lib/supabase"
import type { DiaryEntry as DiaryEntryType } from "@/types"
import { ProfileModal } from "@/pages/ProfileModal"
import { Calendar, Lock, Unlock, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DiaryEntryProps {
  entry: DiaryEntryType
  onEdit?: (entry: DiaryEntryType) => void
}

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

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit }) => {
  const { user } = useAuth()
  const isOwn = entry.userId === user?.id
  const [authorName, setAuthorName] = useState<string>("Cargando...")
  const validatedMood = entry.mood as MoodKey

  const [currentPage, setCurrentPage] = useState(0)
  const [isBookOpen, setIsBookOpen] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next")

  const CHARS_PER_PAGE = 400
  const LINES_PER_PAGE = 12

  const pages = useMemo(() => {
    if (!entry.content) return []

    const paragraphs = entry.content.split(/\n\s*\n/)
    const pages: string[] = []
    let currentPageContent = ""

    for (const paragraph of paragraphs) {
      const testContent = currentPageContent + (currentPageContent ? "\n\n" : "") + paragraph

      if (testContent.length > CHARS_PER_PAGE && currentPageContent) {
        pages.push(currentPageContent)
        currentPageContent = paragraph
      } else {
        currentPageContent = testContent
      }
    }

    if (currentPageContent) {
      pages.push(currentPageContent)
    }

    return pages.length > 0 ? pages : [entry.content]
  }, [entry.content])

  const totalPages = pages.length
  const hasMultiplePages = totalPages > 1

  const wordCount = useMemo(() => entry.content?.trim()?.split(/\s+/).length ?? 0, [entry.content])
  const readMinutes = Math.max(1, Math.round(wordCount / 210))

  useEffect(() => {
    if (isOwn && user) {
      setAuthorName(user.user_metadata?.name || user.email || "Yo")
      return
    }

    const fetchAuthor = async () => {
      setAuthorName("Cargando...")
      const { data, error } = await supabase.from("profiles").select("name").eq("id", entry.userId).single()

      if (error) {
        console.error("Error fetching author name:", error)
        setAuthorName("Desconocido")
      } else {
        setAuthorName(data?.name || "Compañero")
      }
    }
    fetchAuthor()
  }, [entry.userId, isOwn, user])

  const { alignment } = useMemo(() => {
    const align = isOwn ? "justify-end" : "justify-start"
    return { alignment: align }
  }, [isOwn])

  const formattedDate = useMemo(() => {
    try {
      return new Date(entry.date).toISOString().split("T")[0]
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Fecha inválida"
    }
  }, [entry.date])

  const handlePageChange = (direction: "next" | "prev") => {
    if (isFlipping) return

    setIsFlipping(true)
    setFlipDirection(direction)

    setTimeout(() => {
      if (direction === "next" && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1)
      } else if (direction === "prev" && currentPage > 0) {
        setCurrentPage(currentPage - 1)
      }

      setTimeout(() => {
        setIsFlipping(false)
      }, 300)
    }, 300)
  }

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
              fallbackColor={isOwn ? "bg-rose-200 text-rose-800" : "bg-indigo-200 text-indigo-800"}
            />
          </div>
          <div className="flex-1">
            <h3
              className={cn("text-lg font-bold leading-tight font-serif", isOwn ? "text-rose-800" : "text-indigo-800")}
            >
              {entry.title}
            </h3>
            <div
              className={cn("text-xs flex items-center gap-1 font-medium", isOwn ? "text-rose-600" : "text-indigo-600")}
            >
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

        <div className="px-4 pb-2">
          {!isBookOpen && hasMultiplePages ? (
            <div
              className={cn(
                "text-base leading-7 whitespace-pre-wrap tracking-wide font-serif",
                isOwn ? "text-rose-800" : "text-indigo-800",
              )}
            >
              {pages[0].slice(0, 200)}
              {pages[0].length > 200 && "..."}
            </div>
          ) : (
            <div className="min-h-[300px] relative perspective-1000">
              <div className="relative preserve-3d">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={
                      isFlipping
                        ? {
                            rotateY: flipDirection === "next" ? -90 : 90,
                            opacity: 0,
                          }
                        : { rotateY: 0, opacity: 1 }
                    }
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{
                      rotateY: flipDirection === "next" ? 90 : -90,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut",
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    className={cn(
                      "text-base leading-7 whitespace-pre-wrap tracking-wide font-serif p-4 rounded-lg border shadow-inner transform-gpu",
                      isOwn
                        ? "bg-gradient-to-b from-rose-25 via-pink-25 to-rose-50 border-rose-200 text-rose-900"
                        : "bg-gradient-to-b from-indigo-25 via-blue-25 to-indigo-50 border-indigo-200 text-indigo-900",
                    )}
                    style={{
                      minHeight: "280px",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      backgroundImage: `
                        repeating-linear-gradient(
                          transparent,
                          transparent 24px,
                          ${isOwn ? "rgba(244, 63, 94, 0.08)" : "rgba(99, 102, 241, 0.08)"} 24px,
                          ${isOwn ? "rgba(244, 63, 94, 0.08)" : "rgba(99, 102, 241, 0.08)"} 25px
                        )
                      `,
                    }}
                  >
                    {pages[currentPage] || entry.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {hasMultiplePages && isBookOpen && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <button
                    onClick={() => handlePageChange("prev")}
                    disabled={currentPage === 0 || isFlipping}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      currentPage === 0 || isFlipping
                        ? isOwn
                          ? "text-rose-400 cursor-not-allowed"
                          : "text-indigo-400 cursor-not-allowed"
                        : isOwn
                          ? "text-rose-700 hover:text-rose-900 hover:bg-rose-100 hover:shadow-md transform hover:-translate-y-0.5"
                          : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 hover:shadow-md transform hover:-translate-y-0.5",
                    )}
                  >
                    <motion.span
                      className="text-lg"
                      animate={isFlipping && flipDirection === "prev" ? { rotateY: [0, -15, 0] } : {}}
                      transition={{ duration: 0.6 }}
                    >
                      📖
                    </motion.span>
                    Página anterior
                  </button>

                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      isOwn ? "text-rose-600" : "text-indigo-600",
                    )}
                  >
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full border",
                        isOwn ? "bg-rose-100 border-rose-200" : "bg-indigo-100 border-indigo-200",
                      )}
                    >
                      {currentPage + 1} de {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePageChange("next")}
                    disabled={currentPage === totalPages - 1 || isFlipping}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      currentPage === totalPages - 1 || isFlipping
                        ? isOwn
                          ? "text-rose-400 cursor-not-allowed"
                          : "text-indigo-400 cursor-not-allowed"
                        : isOwn
                          ? "text-rose-700 hover:text-rose-900 hover:bg-rose-100 hover:shadow-md transform hover:-translate-y-0.5"
                          : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 hover:shadow-md transform hover:-translate-y-0.5",
                    )}
                  >
                    Página siguiente
                    <motion.span
                      className="text-lg"
                      animate={isFlipping && flipDirection === "next" ? { rotateY: [0, 15, 0] } : {}}
                      transition={{ duration: 0.6 }}
                    >
                      📖
                    </motion.span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "px-4 pb-3 flex items-center justify-between text-xs",
            isOwn ? "text-rose-700/80" : "text-indigo-700/80",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">⏱️ {readMinutes} min</span>
            {hasMultiplePages && <span className="flex items-center gap-1">📚 {totalPages} páginas</span>}
          </div>

          {hasMultiplePages && (
            <button
              onClick={() => {
                setIsBookOpen(!isBookOpen)
                if (!isBookOpen) setCurrentPage(0)
              }}
              className={cn(
                "font-medium transition-colors duration-200 hover:underline",
                isOwn ? "text-rose-600 hover:text-rose-800" : "text-indigo-600 hover:text-indigo-800",
              )}
              aria-label={isBookOpen ? "Cerrar libro" : "Abrir libro"}
            >
              {isBookOpen ? "📕 Cerrar libro" : "📖 Abrir libro"}
            </button>
          )}
        </div>

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
                <div
                  className={cn(
                    "absolute inset-0 border-4 pointer-events-none",
                    isOwn ? "border-rose-100/50" : "border-indigo-100/50",
                  )}
                ></div>
              </div>
            ))}
          </div>
        )}

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

        <div
          className={cn(
            "absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 rounded-tl-lg opacity-60",
            isOwn ? "border-rose-300" : "border-indigo-300",
          )}
        ></div>
        <div
          className={cn(
            "absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 rounded-tr-lg opacity-60",
            isOwn ? "border-rose-300" : "border-indigo-300",
          )}
        ></div>
        <div
          className={cn(
            "absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 rounded-bl-lg opacity-60",
            isOwn ? "border-rose-300" : "border-indigo-300",
          )}
        ></div>
        <div
          className={cn(
            "absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 rounded-br-lg opacity-60",
            isOwn ? "border-rose-300" : "border-indigo-300",
          )}
        ></div>
      </motion.div>
    </div>
  )
}
