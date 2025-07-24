'use client'

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AvatarUploader } from '@/components/AvatarUploader'
import { Heart, ArrowLeft } from 'lucide-react'

export default function EditProfile() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4 transition-all duration-500 ease-in-out">
      <Card className="w-full max-w-md rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 transition-all duration-500 ease-in-out">

        {/* 🠔 Botón volver */}
        <div className="px-6 pt-6">
          <Button
            onClick={() => navigate('/')} // ← Cambia '/' si tu dashboard está en otra ruta
            variant="ghost"
            className="flex items-center space-x-2 text-pink-600 hover:text-pink-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Volver al Dashboard</span>
          </Button>
        </div>

        <CardHeader className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Heart className="h-10 w-10 text-pink-500 mb-2 animate-pulse" />
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent text-center leading-tight">
              Personaliza tu Espacio
            </CardTitle>
          </div>
          <CardDescription className="text-lg text-gray-600 font-medium">
            Haz que tu perfil refleje la belleza de tu historia.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Tu Foto de Perfil</h3>
            <p className="text-sm text-gray-500 text-center">
              Elige una imagen que capture tu esencia o un momento especial.
            </p>
            <AvatarUploader />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
