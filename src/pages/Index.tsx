// src/pages/Index.tsx
import React from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { AuthForm } from '@/components/AuthForm'
import { Dashboard } from './Dashboard'
import { Heart } from 'lucide-react'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-pink-500 animate-pulse mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthForm />
}
