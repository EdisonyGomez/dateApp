"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DialogClose } from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Calendar,
  Edit,
  Loader2,
  Handshake,
  Languages,
  ChefHat,
  Palette,
  Headphones,
  Clapperboard,
  Heart,
  Star,
  Sparkles,
  Crown,
  X,
} from "lucide-react"

interface ProfileModalProps {
  userId: string
  fallbackColor?: string
  isCurrentUser?: boolean
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, fallbackColor, isCurrentUser = false }) => {
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, name, avatar_url, birthday, meet_date, chinese_day, 
          languages, profession, favorite_foods, hobbies, 
          favorite_music, favorite_songs, favorite_movies
        `)
        .eq("id", userId)
        .single()

      if (!error) setProfile(data)
      setLoading(false)
    }

    if (userId) fetchProfile()
  }, [userId])

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase.from("profiles").update(profile).eq("id", userId)
    setLoading(false)

    if (error) {
      toast.error("Error al guardar los cambios. Por favor, inténtalo de nuevo.")
    } else {
      toast.success("¡Perfil actualizado con éxito!")
      setEditing(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const renderViewField = (
    icon: React.ElementType,
    label: string,
    value: string | string[] | undefined,
    gradient?: string,
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null

    const IconComponent = icon
    const gradientClass = gradient || "from-pink-400 to-rose-500"

    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-pink-50 p-6 shadow-lg border border-pink-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105">
        <div className="flex items-start gap-5">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">{label}</p>
            {Array.isArray(value) ? (
              <div className="flex flex-wrap gap-2">
                {value.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border border-pink-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 font-semibold text-lg">{value}</p>
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100 to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
      </div>
    )
  }

  // Componente de partículas
  const ParticleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Corazones flotantes */}
        {[...Array(12)].map((_, i) => (
          <Heart
            key={`heart-${i}`}
            className={`absolute text-pink-300/40 animate-float-${(i % 4) + 1}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
            }}
          />
        ))}

        {/* Estrellas flotantes */}
        {[...Array(8)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className={`absolute text-yellow-300/30 animate-twinkle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 8}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}

        {/* Sparkles flotantes */}
        {[...Array(15)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className={`absolute text-pink-400/30 animate-sparkle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 18 + 12}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 6 + 4}s`,
            }}
          />
        ))}

        {/* Círculos de colores */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className={`absolute rounded-full bg-gradient-to-br from-pink-200/20 to-rose-300/20 animate-drift`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${Math.random() * 15 + 20}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (loading || !profile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <span className="cursor-pointer inline-flex transition-all duration-300 hover:scale-110 hover:rotate-2">
            <UserAvatar name="Cargando" size="xl" fallbackColor={fallbackColor} />
          </span>
        </DialogTrigger>
        <DialogContent className="w-[500px] bg-gradient-to-br from-pink-50 to-white rounded-3xl p-8 shadow-2xl border-0 overflow-hidden">
          {/* Botón de cerrar llamativo para loading */}
          <DialogClose asChild>
            <button className="absolute top-4 right-4 z-50 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90">
                  <X className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>
              </div>
            </button>
          </DialogClose>

          <ParticleBackground />
          <div className="flex flex-col items-center justify-center py-12 relative z-10">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-pink-500 animate-spin" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-pink-500 opacity-20 animate-ping"></div>
            </div>
            <p className="text-xl text-gray-700 font-semibold mt-6 animate-pulse">Cargando perfil...</p>
            <div className="flex space-x-1 mt-4">
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" />
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span className="cursor-pointer inline-flex transition-all duration-300 hover:scale-110 hover:rotate-2 hover:shadow-lg rounded-full">
          <UserAvatar
            name={profile?.name || "Usuario"}
            avatarUrl={profile?.avatar_url}
            size="xl"
            fallbackColor={fallbackColor}
          />
        </span>
      </DialogTrigger>

      <DialogContent className="w-[1000px] max-w-[95vw] h-[85vh] overflow-hidden bg-gradient-to-br from-white via-pink-50 to-rose-50 rounded-3xl p-0 shadow-2xl border-0">
        {/* Botón de cerrar súper llamativo */}
        <DialogClose asChild>
          <button className="absolute top-6 right-6 z-50 group">
            <div className="relative">
              {/* Círculo principal con gradiente */}
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-full shadow-2xl group-hover:shadow-pink-500/50 transition-all duration-500 flex items-center justify-center group-hover:scale-125 group-hover:rotate-180 border-2 border-white">
                <X className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Anillo exterior animado */}
              <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-0 group-hover:opacity-30 animate-ping"></div>

              {/* Anillo de pulso constante */}
              <div className="absolute inset-0 w-14 h-14 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>

              {/* Sparkles decorativos */}
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce" />
              <Heart className="absolute -bottom-1 -left-1 h-3 w-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            </div>
          </button>
        </DialogClose>

        <ParticleBackground />
        <div className="h-full overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-8 pt-16">
            {" "}
            {/* Añadido pt-16 para dar espacio al botón de cerrar */}
            {/* Header con imagen lateral */}
            <div className="flex gap-8 mb-8">
              {/* Imagen del perfil */}
              <div className="relative w-72 h-72 flex-shrink-0">
                <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-pink-200">
                  <img
                    src={profile.avatar_url || "/placeholder.svg?height=320&width=320"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-900/20 to-transparent"></div>
                </div>
              </div>

              {/* Información principal */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="mb-6">
                  <h2 className="text-5xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                    {profile.name}
                    <Crown className="h-10 w-10 text-yellow-500" />
                  </h2>
                  <p className="text-2xl text-pink-600 font-semibold mb-6">
                    {profile.profession || "Profesión no especificada"}
                  </p>
                </div>

                {/* Botones de acción principales */}
                {isCurrentUser && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setEditing(true)}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {/* Información detallada del perfil */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-8 w-8 text-pink-500" />
                  Información Personal
                  <Sparkles className="h-8 w-8 text-pink-500" />
                </h3>
                <p className="text-lg text-gray-600">Conoce más sobre {profile.name}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderViewField(Calendar, "Cumpleaños", profile.birthday, "from-pink-400 to-rose-500")}
                {renderViewField(Handshake, "Se conocieron", profile.meet_date, "from-rose-400 to-pink-500")}
                {renderViewField(Calendar, "Día Chino", profile.chinese_day, "from-red-400 to-pink-500")}
                {renderViewField(Languages, "Idiomas", profile.languages, "from-purple-400 to-pink-500")}
                {renderViewField(ChefHat, "Comidas Favoritas", profile.favorite_foods, "from-orange-400 to-pink-500")}
                {renderViewField(Palette, "Pasatiempos", profile.hobbies, "from-teal-400 to-pink-500")}
                {renderViewField(Headphones, "Género Musical", profile.favorite_music, "from-indigo-400 to-pink-500")}
                {renderViewField(
                  Headphones,
                  "Canciones Favoritas",
                  profile.favorite_songs,
                  "from-blue-400 to-pink-500",
                )}
                {renderViewField(
                  Clapperboard,
                  "Películas Favoritas",
                  profile.favorite_movies,
                  "from-gray-400 to-pink-500",
                )}
              </div>
            </div>
            {/* Botones de acción adicionales */}
            {isCurrentUser && (
              <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-pink-200">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/edit-profile")}
                    className="flex-1 text-pink-700 border-2 border-pink-300 hover:border-pink-500 hover:text-pink-800 hover:bg-pink-50 transition-all duration-300 rounded-2xl py-4 font-semibold text-lg"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Editar Perfil Completo
                  </Button>
                </DialogClose>

                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Heart className="h-5 w-5 mr-2" />
                  Compartir Perfil
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fce7f3;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f472b6, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ec4899, #db2777);
        }

        /* Animaciones de partículas */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
          75% { transform: translateY(-30px) rotate(270deg); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-25px) rotate(120deg); }
          66% { transform: translateY(-15px) rotate(240deg); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          20% { transform: translateY(-15px) rotate(72deg); }
          40% { transform: translateY(-30px) rotate(144deg); }
          60% { transform: translateY(-10px) rotate(216deg); }
          80% { transform: translateY(-25px) rotate(288deg); }
        }

        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-35px) rotate(180deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
          25% { opacity: 0.8; transform: scale(1.1) rotate(90deg); }
          50% { opacity: 0.4; transform: scale(1.3) rotate(180deg); }
          75% { opacity: 0.9; transform: scale(0.9) rotate(270deg); }
        }

        @keyframes drift {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-15px); }
          50% { transform: translateX(-10px) translateY(-30px); }
          75% { transform: translateX(-25px) translateY(-10px); }
          100% { transform: translateX(0px) translateY(0px); }
        }

        .animate-float-1 { animation: float-1 infinite ease-in-out; }
        .animate-float-2 { animation: float-2 infinite ease-in-out; }
        .animate-float-3 { animation: float-3 infinite ease-in-out; }
        .animate-float-4 { animation: float-4 infinite ease-in-out; }
        .animate-twinkle { animation: twinkle infinite ease-in-out; }
        .animate-sparkle { animation: sparkle infinite ease-in-out; }
        .animate-drift { animation: drift infinite ease-in-out; }
      `}</style>
    </Dialog>
  )
}
