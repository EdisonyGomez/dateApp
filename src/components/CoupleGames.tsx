import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  Heart,
  Zap,
  Trophy,
  Star,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

/* ──────────────────── Tipos ──────────────────── */
interface GameQuestion {
  id: string
  question: string
  category: 'deep' | 'fun' | 'memory' | 'future' | 'intimate'
}

interface GameStreak {
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string
  totalQuestionsAnswered: number
}

/* ───────────────── Preguntas ─────────────────── */
const coupleQuestions: GameQuestion[] = [
  // Deep questions
  { id: '1', question: '¿Cuál es tu mayor sueño que aún no me has contado?', category: 'deep' },
  { id: '2', question: "What's one thing you'd change about your past if you could?", category: 'deep' },
  { id: '3', question: '你最害怕失去什么？', category: 'deep' },
  { id: '4', question: '¿Qué te hace sentir más vulnerable conmigo?', category: 'deep' },
  { id: '5', question: 'Describe a moment when you felt most proud of yourself', category: 'deep' },
  // Fun questions
  { id: '6', question: 'If we could have any superpower as a couple, what would it be?', category: 'fun' },
  { id: '7', question: '¿Cuál sería nuestro baile característico si fuéramos famosos?', category: 'fun' },
  { id: '8', question: '如果我们可以养任何动物作为宠物，你会选择什么？', category: 'fun' },
  { id: '9', question: '¿Qué película describiría mejor nuestra relación?', category: 'fun' },
  { id: '10', question: 'What would be the title of a book about our love story?', category: 'fun' },
  // Memory questions
  { id: '11', question: '¿Cuál fue el momento exacto en que supiste que me amabas?', category: 'memory' },
  { id: '12', question: "What's your favorite memory of us from this past month?", category: 'memory' },
  { id: '13', question: '我们第一次见面时，你对我的第一印象是什么？', category: 'memory' },
  { id: '14', question: '¿Qué es lo más gracioso que hemos hecho juntos?', category: 'memory' },
  { id: '15', question: 'Describe our perfect day together from this year', category: 'memory' },
  // Future questions
  { id: '16', question: '¿Dónde te ves a ti y a nosotros en 5 años?', category: 'future' },
  { id: '17', question: 'What tradition would you like us to start as a couple?', category: 'future' },
  { id: '18', question: '你希望我们一起去哪里旅行？', category: 'future' },
  { id: '19', question: '¿Qué aventura te gustaría que viviéramos juntos?', category: 'future' },
  { id: '20', question: 'How do you want to celebrate our next anniversary?', category: 'future' },
  // Intimate questions
  { id: '21', question: '¿Qué es lo que más admiras de mí como persona?', category: 'intimate' },
  { id: '22', question: 'When do you feel most connected to me?', category: 'intimate' },
  { id: '23', question: '我做什么让你感到最被爱？', category: 'intimate' },
  { id: '24', question: '¿Cómo puedo apoyarte mejor cuando tienes un mal día?', category: 'intimate' },
  { id: '25', question: "What's one way I've grown since we've been together?", category: 'intimate' }
]

/* ──────────────── Estilos por categoría ──────────────── */
const categoryColors: Record<GameQuestion['category'], string> = {
  deep: 'bg-purple-100 text-purple-800',
  fun: 'bg-yellow-100 text-yellow-800',
  memory: 'bg-blue-100 text-blue-800',
  future: 'bg-green-100 text-green-800',
  intimate: 'bg-pink-100 text-pink-800'
}

const categoryEmojis: Record<GameQuestion['category'], string> = {
  deep: '🤔',
  fun: '😄',
  memory: '💭',
  future: '🔮',
  intimate: '💕'
}

/* ──────────────────── Componente ──────────────────── */
export const CoupleGames: React.FC = () => {
  const { user } = useAuth()
  const [partnerLinked, setPartnerLinked] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  const [gameStreak, setGameStreak] = useState<GameStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    totalQuestionsAnswered: 0
  })
  const [answeredToday, setAnsweredToday] = useState(false)

  /* ────── verifica vínculo de pareja ────── */
  useEffect(() => {
    const fetchPartner = async () => {
      if (!user) {
        setPartnerLinked(false)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()
      if (error) console.error(error)
      setPartnerLinked(!!data?.partner_id)
    }
    fetchPartner()
  }, [user])

  /* ────── carga progreso local ────── */
  useEffect(() => {
    if (!user) return
    const stored = localStorage.getItem(`coupleGame_${user.id}`)
    if (!stored) return

    const data: GameStreak = JSON.parse(stored)
    setGameStreak(data)
    const today = new Date().toISOString().split('T')[0]
    setAnsweredToday(data.lastPlayedDate === today)
  }, [user])

  /* ───────────── helpers ───────────── */
  const getRandomQuestion = (): GameQuestion => {
    const pool = coupleQuestions.filter(q => q.id !== currentQuestion?.id)
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const startGame = () => {
    if (!partnerLinked) {
      toast.error('Link your partner first to start playing games!')
      return
    }
    setCurrentQuestion(getRandomQuestion())
  }

  const markQuestionAnswered = () => {
    if (!user || !currentQuestion) return

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = gameStreak.currentStreak
    if (gameStreak.lastPlayedDate === yesterdayStr || gameStreak.lastPlayedDate === '') {
      newStreak += 1
    } else if (gameStreak.lastPlayedDate !== today) {
      newStreak = 1
    }

    const updated: GameStreak = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, gameStreak.longestStreak),
      lastPlayedDate: today,
      totalQuestionsAnswered: gameStreak.totalQuestionsAnswered + 1
    }

    setGameStreak(updated)
    setAnsweredToday(true)
    localStorage.setItem(`coupleGame_${user.id}`, JSON.stringify(updated))
    toast.success(`Great! Your streak is now ${newStreak} days! 🔥`)
    setCurrentQuestion(null)
  }

  const getNextQuestion = () => setCurrentQuestion(getRandomQuestion())

  const streakPercentage = Math.min((gameStreak.currentStreak / 30) * 100, 100)

  /* ──────────────────── UI ──────────────────── */
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="h-6 w-6 mr-2 text-pink-500" />
            Couple Games
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              {gameStreak.currentStreak} day streak
            </Badge>
            {gameStreak.longestStreak > 0 && (
              <Badge variant="outline" className="flex items-center">
                <Trophy className="h-3 w-3 mr-1" />
                Best: {gameStreak.longestStreak}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Streak Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Daily Streak Progress</span>
            <span>{gameStreak.currentStreak}/30 days</span>
          </div>
          <Progress value={streakPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Play daily to build your streak! Total questions answered: {gameStreak.totalQuestionsAnswered}
          </p>
        </div>

        {/* Current Question */}
        {currentQuestion ? (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <Badge className={categoryColors[currentQuestion.category]}>
                  {categoryEmojis[currentQuestion.category]} {currentQuestion.category}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getNextQuestion}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={markQuestionAnswered}
                className="flex-1"
                disabled={answeredToday}
              >
                <Star className="h-4 w-4 mr-2" />
                {answeredToday ? 'Already Played Today!' : 'We Discussed This!'}
              </Button>
              <Button variant="outline" onClick={() => setCurrentQuestion(null)}>
                Skip
              </Button>
            </div>

            {answeredToday && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  🎉 You've already played today! Come back tomorrow to continue your streak.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
              <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Daily Couple Challenge</h3>
              <p className="text-muted-foreground mb-6">
                Strengthen your bond with thoughtful questions and conversations.
                Questions support multiple languages!
              </p>

              {!partnerLinked ? (
                <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                  💡 Link your partner first to unlock couple games!
                </div>
              ) : answeredToday ? (
                <div className="p-4 bg-green-50 rounded-lg mb-4">
                  <p className="text-sm text-green-700">
                    ✅ Great job! You've played today. Come back tomorrow for your next question!
                  </p>
                </div>
              ) : null}

              <Button 
                onClick={startGame} 
                size="lg"
                disabled={ answeredToday}
                className="min-w-[200px]"
              >
                {answeredToday ? 'Come Back Tomorrow' : 'Start Daily Question'}
              </Button>
            </div>

            {gameStreak.totalQuestionsAnswered > 0 && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-pink-600">{gameStreak.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">{gameStreak.longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Longest Streak</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{gameStreak.totalQuestionsAnswered}</div>
                  <div className="text-xs text-muted-foreground">Total Questions</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};