"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Plus, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

// Hooks
import {
  useGameStreak,
  usePartnerLink,
  useDailyQuestion,
  useCanAnswer,
  useGameResponses,
  useReactions,
} from "@/hooks/useGameHooks"
import { GameService } from "@/lib/GameService"

// Components
import { GameStats } from "./GameStats"
import { DailyQuestionCard } from "./DailyQuestionCard"
import { GameResponsesList } from "./GameResponsesList"
import { QuestionFormModal } from "./QuestionFormModal"
import { GameResponse } from "@/types"

export const CoupleGames: React.FC = () => {
  // State
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [noQuestionsAvailable, setNoQuestionsAvailable] = useState(false)

  // Hooks
  const { gameStreak, updateStreak } = useGameStreak()
  const { partnerLinked, loading: partnerLoading } = usePartnerLink()
  const { dailyQuestion, loading: questionLoading, loadDailyQuestion } = useDailyQuestion()
  const { canAnswer, loading: canAnswerLoading } = useCanAnswer()
  const { responses, addResponse } = useGameResponses()
  const { reactions, toggleReaction } = useReactions(responses)

  // Effect to check if no questions are available and auto-open modal
  useEffect(() => {
    if (!questionLoading && !dailyQuestion && partnerLinked && canAnswer) {
      setNoQuestionsAvailable(true)
      // Auto-open modal after a short delay to let the UI render
      const timer = setTimeout(() => {
        setShowQuestionModal(true)
        toast.info("No hay preguntas activas disponibles. ¡Crea una nueva para continuar jugando!")
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setNoQuestionsAvailable(false)
    }
  }, [questionLoading, dailyQuestion, partnerLinked, canAnswer])

  // Handlers
  const handleStartGame = () => {
    if (!partnerLinked) {
      toast.error("Link your partner first to start playing games!")
      return
    }
    if (!dailyQuestion) {
      toast.error("No question available for today. Please try again later.")
      return
    }
  }

  const handleNewQuestion = async () => {
    const today = new Date().toISOString().split("T")[0]
    await loadDailyQuestion(today)
  }

  const handleAnswerSubmitted = (response: GameResponse) => {
    addResponse(response)
  }
  const handleQuestionCreated = async () => {
    // Reload daily question in case the new question should be today's question
    const today = new Date().toISOString().split("T")[0]
    await loadDailyQuestion(today)
    setShowQuestionModal(false)
    setNoQuestionsAvailable(false)
    toast.success("¡Pregunta creada exitosamente! 🎉")
  }

  const handleCloseModal = () => {
    setShowQuestionModal(false)
    // If there were no questions available, reload to check if the new question is now available
    if (noQuestionsAvailable) {
      const today = new Date().toISOString().split("T")[0]
      loadDailyQuestion(today)
    }
  }

  // Loading states
  if (partnerLoading || questionLoading || canAnswerLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Game Card */}
      <Card className="shadow-lg border-pink-100">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-6 w-6 mr-2 text-pink-500 animate-pulse" />
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Couple Games
              </span>
            </div>
            {/* Botón para crear pregunta - Posición prominente */}
            {partnerLinked && (
              <Button
                onClick={() => setShowQuestionModal(true)}
                size="sm"
                variant="outline"
                className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 hover:text-pink-700 transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Pregunta
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Game Stats */}
          <GameStats gameStreak={gameStreak} />

          {/* Daily Question or Start Game */}
          {dailyQuestion && partnerLinked ? (
            <DailyQuestionCard
              dailyQuestion={dailyQuestion}
              canAnswer={canAnswer}
              onAnswerSubmitted={handleAnswerSubmitted}
              onUpdateStreak={updateStreak}
              // onNewQuestion={handleNewQuestion}
            />
          ) : (

            <div className="text-center space-y-4">
              <div className="p-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 shadow-inner">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Heart className="h-12 w-12 text-pink-500 animate-pulse" />
                    <Sparkles className="h-6 w-6 text-purple-400 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Daily Couple Challenge
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Fortalece tu vínculo con preguntas reflexivas y conversaciones profundas.
                  <br />
                  <span className="text-sm text-purple-500 font-medium">
                    ¡Las preguntas soportan múltiples idiomas!
                  </span>
                </p>

                {!partnerLinked ? (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg mb-6 border border-yellow-200">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">💡</span>
                      <p className="text-yellow-800 font-medium">
                        ¡Conecta con tu pareja primero para desbloquear los juegos!
                      </p>
                    </div>
                  </div>
                ) : !canAnswer ? (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-6 border border-green-200">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">✅</span>
                      <p className="text-green-800 font-medium">
                        ¡Excelente trabajo! Ya jugaste hoy. ¡Vuelve mañana por tu próxima pregunta!
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Mensaje indicando que no hay preguntas disponibles */}
                {partnerLinked && !dailyQuestion && canAnswer ? (
                  <div className="text-center space-y-4">
                    <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 shadow-inner">
                      <div className="flex justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-orange-800">¡No hay preguntas activas disponibles!</h3>
                      <p className="text-orange-700 mb-6">
                        Todas las preguntas han sido respondidas o desactivadas. 
                        <br />
                        <strong>Crea una nueva pregunta para continuar jugando.</strong>
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button 
                          onClick={() => setShowQuestionModal(true)}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Nueva Pregunta
                        </Button>
                        <Button variant="outline" onClick={handleNewQuestion}>
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Botón de inicio del juego - solo si hay pregunta disponible */}
                {dailyQuestion && (
                  <Button
                    onClick={handleStartGame}
                    size="lg"
                    disabled={!partnerLinked || !canAnswer || !dailyQuestion}
                    className="min-w-[200px] bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {!canAnswer ? "Vuelve Mañana" : "Comenzar Pregunta Diaria"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Past Responses */}
          {responses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <h3 className="text-lg font-semibold text-gray-800">Respuestas Anteriores</h3>
              </div>
              <GameResponsesList responses={responses} reactions={reactions} onToggleReaction={toggleReaction} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Creation Modal */}
      <QuestionFormModal
        isOpen={showQuestionModal}
        onClose={handleCloseModal}
        onQuestionCreated={handleQuestionCreated}
      />
    </div>
  )
}