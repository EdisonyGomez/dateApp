// components/DailyQuestionCard.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DailyQuestion, GameResponse } from '@/types'
import { categoryColors, categoryEmojis } from '@/lib/gameConstants'
import { GameService } from '@/lib/GameService'
import { useAuth } from '@/contexts/AuthProvider'
import { toast } from 'sonner'
import { Star, RefreshCw } from 'lucide-react'

interface DailyQuestionCardProps {
  dailyQuestion: DailyQuestion
  canAnswer: boolean
  onAnswerSubmitted: (response: GameResponse) => void
  onUpdateStreak: (date: string) => void
  onNewQuestion: () => void
}

export const DailyQuestionCard: React.FC<DailyQuestionCardProps> = ({
  dailyQuestion,
  canAnswer,
  onAnswerSubmitted,
  onUpdateStreak,
  onNewQuestion
}) => {
  const { user } = useAuth()
  const [userAnswer, setUserAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitAnswer = async () => {
    if (!user || !userAnswer.trim() || !canAnswer) return

    setSubmitting(true)
    const today = new Date().toISOString().split('T')[0]

    const responseData = {
      user_id: user.id,
      question_id: dailyQuestion.question_id,
      question: dailyQuestion.game_questions.question,
      category: dailyQuestion.game_questions.category,
      answer: userAnswer.trim(),
      date: today,
      is_private: false
    }

    const savedResponse = await GameService.saveGameResponse(responseData)

    if (savedResponse) {
      onAnswerSubmitted(savedResponse)
      onUpdateStreak(today)
      setUserAnswer('')
      toast.success('Answer saved successfully! 🎉')
    } else {
      toast.error('Failed to save answer. Please try again.')
    }

    setSubmitting(false)
  }

  if (!dailyQuestion.game_questions) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">Error loading today's question. Please try again later.</p>
      </div>
    )
  }

  const question = dailyQuestion.game_questions

  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <Badge className={categoryColors[question.category]}>
            {categoryEmojis[question.category]} {question.category}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewQuestion}
            className="text-muted-foreground"
            disabled={!canAnswer}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-lg font-medium leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          placeholder="Write your answer here..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-3 border rounded-md resize-none min-h-[100px]"
          disabled={!canAnswer || submitting}
        />

        <div className="flex space-x-3">
          <Button
            onClick={handleSubmitAnswer}
            className="flex-1"
            disabled={!canAnswer || !userAnswer.trim() || submitting}
          >
            <Star className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : !canAnswer ? 'Already Played Today!' : 'Submit Answer'}
          </Button>
        </div>
      </div>

      {!canAnswer && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            🎉 You've already played today! Come back tomorrow to continue your streak.
          </p>
        </div>
      )}
    </div>
  )
}