"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GameQuestion } from "@/types"
import { categoryColors, categoryEmojis } from "@/lib/gameConstants"
import { GameService } from "@/lib/GameService"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import { Heart, Sparkles, Save, X } from "lucide-react"

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onQuestionCreated?: (question?: GameQuestion) => void
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({ isOpen, onClose, onQuestionCreated }) => {
  const { user } = useAuth()
  const [questionText, setQuestionText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<GameQuestion["category"]>("deep")
  const [submitting, setSubmitting] = useState(false)

  const categories: { value: GameQuestion["category"]; label: string; description: string }[] = [
    { value: "deep", label: "Profunda", description: "Preguntas que exploran emociones y pensamientos íntimos" },
    { value: "fun", label: "Divertida", description: "Preguntas ligeras y entretenidas para reír juntos" },
    { value: "memory", label: "Recuerdo", description: "Preguntas sobre momentos especiales compartidos" },
    { value: "future", label: "Futuro", description: "Preguntas sobre sueños y planes a futuro" },
    { value: "intimate", label: "Íntima", description: "Preguntas personales para fortalecer la conexión" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !questionText.trim()) return

    setSubmitting(true)

    const newQuestion: GameQuestion = {
      id: "", // Will be set by database
      question: questionText.trim(),
      category: selectedCategory,
      created_by: user.id,
      is_active: true,
    }

    const savedQuestion = await GameService.createCustomQuestion(newQuestion)
    if (savedQuestion) {
      setQuestionText("")
      setSelectedCategory("deep")
      onQuestionCreated?.(savedQuestion)
    } else {
      toast.error("Error al crear la pregunta. Por favor, inténtalo de nuevo.")
    }

    setSubmitting(false)
  }

  const handleClose = () => {
    if (!submitting) {
      setQuestionText("")
      setSelectedCategory("deep")
      onClose()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 animate-fade-in">
        <DialogHeader className="text-center space-y-3 pb-4 border-b border-pink-100">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-2">
              <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
              <Sparkles className="h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <DialogTitle className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Crear Pregunta Personalizada
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 font-medium mt-2">
              Crea una pregunta única para fortalecer tu conexión
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Question Input */}
          <div className="space-y-3">
            <Label htmlFor="question-text" className="text-gray-700 font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Tu Pregunta
            </Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Escribe aquí tu pregunta personalizada..."
              className="input-field-style min-h-[100px] resize-none"
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500">
              Tip: Haz preguntas abiertas que inviten a la reflexión y conversación profunda
            </p>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Categoría
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((category) => (
                <div
                  key={category.value}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${selectedCategory === category.value
                    ? "border-pink-400 bg-pink-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-25"
                    }`}
                  onClick={() => !submitting && setSelectedCategory(category.value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${selectedCategory === category.value
                          ? categoryColors[category.value]
                          : "bg-gray-100 text-gray-600"
                          } transition-all duration-300`}
                      >
                        {categoryEmojis[category.value]} {category.label}
                      </Badge>
                    </div>
                    {selectedCategory === category.value && (
                      <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="button-outline-style transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!questionText.trim() || submitting}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Pregunta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
