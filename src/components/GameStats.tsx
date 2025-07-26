// components/GameStats.tsx
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GameStreak } from '@/types'
import { GAME_CONFIG } from '@/lib/gameConstants'
import { Zap, Trophy } from 'lucide-react'

interface GameStatsProps {
  gameStreak: GameStreak
}

export const GameStats: React.FC<GameStatsProps> = ({ gameStreak }) => {
  const streakPercentage = Math.min((gameStreak.currentStreak / GAME_CONFIG.STREAK_TARGET) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Badges */}
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

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Daily Streak Progress</span>
          <span>{gameStreak.currentStreak}/{GAME_CONFIG.STREAK_TARGET} days</span>
        </div>
        <Progress value={streakPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Play daily to build your streak! Total questions answered: {gameStreak.totalQuestionsAnswered}
        </p>
      </div>

      {/* Stats Grid */}
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
  )
}