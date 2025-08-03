"use client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AvatarUploader } from "@/components/AvatarUploader"
import {
  Heart,
  ArrowLeft,
  User,
  Calendar,
  Music,
  Film,
  BookOpen,
  Utensils,
  Smile,
  MapPin,
  Star,
  Sparkles,
  Save,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthProvider"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Profile } from "@/types"

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [favoriteMoviesText, setFavoriteMoviesText] = useState("")
  const [favoriteSongsText, setFavoriteSongsText] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()
      if (!error && data) {
        setProfile(data)
        setFavoriteMoviesText(data.favorite_movies?.join(", ") || "")
        setFavoriteSongsText(data.favorite_songs?.join(", ") || "")
      }
      setLoading(false)
    }
    if (user?.id) fetchProfile()
  }, [user?.id])

  const updateField = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profile || !user?.id) return

    setLoading(true)

    const updatedProfile = {
      ...profile,
      favorite_movies: favoriteMoviesText
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean),
      favorite_songs: favoriteSongsText
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean),
      special_places: profile.special_places || [],
      favorite_activities: profile.favorite_activities || [],
      dream_destinations: profile.dream_destinations || [],
      future_goals: profile.future_goals || [],
      love_languages: profile.love_languages || [],
      pet_names: profile.pet_names || [],
      relationship_milestones: profile.relationship_milestones || [],
      anniversaries: profile.anniversaries || {},
    }

    const { error } = await supabase.from("profiles").update(updatedProfile).eq("id", user.id)

    setLoading(false)

    if (error) {
      toast.error("Error al actualizar el perfil. Por favor, inténtalo de nuevo.")
    } else {
      toast.success("¡Perfil actualizado con éxito!")
      navigate("/")
    }
  }

  // Componente de partículas de fondo
  const ParticleBackground = () => {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <Heart
            key={`heart-${i}`}
            className="absolute text-pink-300/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className="absolute text-yellow-300/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 8}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className="absolute text-pink-400/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 18 + 12}px`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 4 + 2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-white to-rose-100 relative overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 text-center">
          <div className="relative mb-6">
            <Heart className="h-16 w-16 text-pink-500 animate-pulse mx-auto" />
            <div className="absolute inset-0 h-16 w-16 rounded-full bg-pink-500 opacity-20 animate-ping mx-auto"></div>
          </div>
          <p className="text-xl text-gray-700 font-semibold">Cargando tu espacio personal...</p>
          <div className="flex space-x-1 mt-4 justify-center">
            <Heart className="w-4 h-4 text-pink-500 animate-bounce" />
            <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center justify-center p-4 py-8">
        {/* Botón "Regresar al Dashboard" */}
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-8 self-start md:self-center transition-all duration-300 ease-in-out hover:translate-x-[-4px] hover:shadow-lg hover:border-pink-300 text-gray-700 hover:text-pink-600 bg-white/80 backdrop-blur-sm border-pink-200 rounded-2xl px-6 py-3 font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Regresar al Dashboard
        </Button>

        <Card className="w-full max-w-4xl rounded-3xl shadow-2xl shadow-pink-200/50 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center space-y-6 pt-12 pb-8 bg-gradient-to-br from-pink-50 to-rose-50 relative">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4">
              <Heart className="h-8 w-8 text-pink-300 animate-pulse" />
            </div>
            <div className="absolute top-4 right-4">
              <Sparkles className="h-8 w-8 text-rose-300 animate-pulse" />
            </div>

            <div className="relative">
              <Heart className="h-16 w-16 text-pink-500 mb-4 animate-pulse mx-auto" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-pink-500 opacity-20 animate-ping mx-auto"></div>
            </div>

            <CardTitle className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent leading-tight">
              Personaliza tu Perfil
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Haz que tu perfil refleje tu historia única y tus momentos más preciados. ✨
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-12 p-8">
            {/* Sección: Tu Foto de Perfil */}
            <div className="space-y-6 text-center border-b border-pink-100 pb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Tu Foto de Perfil</h3>
              </div>
              <p className="text-lg text-gray-600 mb-8">Elige una imagen especial que te represente</p>

              <AvatarUploader size="xl" onAvatarUpdate={(url) => updateField("avatar_url", url)} />
            </div>

            {/* Sección: Información Personal */}
            <div className="space-y-8 border-b border-pink-100 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Detalles Personales</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 group">
                  <Label htmlFor="name" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-400" />
                    Tu Nombre
                  </Label>
                  <Input
                    id="name"
                    value={profile.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Ej: Melo"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="birthday" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-400" />
                    Fecha de Cumpleaños
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={profile.birthday || ""}
                    onChange={(e) => updateField("birthday", e.target.value)}
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="meet_date" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-400" />
                    Día que se conocieron
                  </Label>
                  <Input
                    id="meet_date"
                    type="date"
                    value={profile.meet_date || ""}
                    onChange={(e) => updateField("meet_date", e.target.value)}
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="chinese_day" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Gotcha Day
                  </Label>
                  <Input
                    id="chinese_day"
                    value={profile.chinese_day || ""}
                    onChange={(e) => updateField("chinese_day", e.target.value)}
                    placeholder="Ej: 2024-01-01"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 md:col-span-2 group">
                  <Label htmlFor="profession" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" />
                    Profesión
                  </Label>
                  <Input
                    id="profession"
                    value={profile.profession || ""}
                    onChange={(e) => updateField("profession", e.target.value)}
                    placeholder="Ej: Desarrollador de Software"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Gustos e Intereses */}
            <div className="space-y-8 border-b border-pink-100 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-lg">
                  <Smile className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Tus Gustos y Pasatiempos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 group">
                  <Label htmlFor="languages" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    Idiomas que hablas
                  </Label>
                  <Textarea
                    id="languages"
                    value={profile.languages?.join(", ") || ""}
                    onChange={(e) =>
                      updateField(
                        "languages",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Español, Inglés, Francés"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label
                    htmlFor="favorite_foods"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    <Utensils className="h-4 w-4 text-pink-400" />
                    Comidas favoritas
                  </Label>
                  <Textarea
                    id="favorite_foods"
                    value={profile.favorite_foods?.join(", ") || ""}
                    onChange={(e) =>
                      updateField(
                        "favorite_foods",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Pizza, Sushi, Tacos"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 md:col-span-2 group">
                  <Label htmlFor="hobbies" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4 text-purple-400" />
                    Pasatiempos
                  </Label>
                  <Textarea
                    id="hobbies"
                    value={profile.hobbies?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "hobbies",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Leer novelas románticas | Caminar por la playa | Cocinar postres"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada pasatiempo con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 group">
                  <Label
                    htmlFor="favorite_music"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    <Music className="h-4 w-4 text-pink-400" />
                    Género musical favorito
                  </Label>
                  <Input
                    id="favorite_music"
                    value={profile.favorite_music || ""}
                    onChange={(e) => updateField("favorite_music", e.target.value)}
                    placeholder="Ej: Pop, Rock, Clásica"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label
                    htmlFor="favorite_songs"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    <Music className="h-4 w-4 text-purple-400" />
                    Canciones favoritas
                  </Label>
                  <Textarea
                    id="favorite_songs"
                    value={favoriteSongsText}
                    onChange={(e) => setFavoriteSongsText(e.target.value)}
                    placeholder="Ej: Bohemian Rhapsody - Queen | Yellow - Coldplay | Let It Be - The Beatles"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada canción con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 md:col-span-2 group">
                  <Label
                    htmlFor="favorite_movies"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    <Film className="h-4 w-4 text-pink-400" />
                    Películas favoritas
                  </Label>
                  <Textarea
                    id="favorite_movies"
                    value={favoriteMoviesText}
                    onChange={(e) => setFavoriteMoviesText(e.target.value)}
                    placeholder="Ej: Eden Lake | The Notebook | Everything Everywhere All At Once"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada película con " | " (barra vertical)</p>
                </div>
              </div>
            </div>

            {/* Sección: Historia de Amor */}
            <div className="space-y-8 border-b border-pink-100 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Nuestra Historia</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 md:col-span-2 group">
                  <Label htmlFor="love_story" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    💖 Nuestra Historia de Amor
                  </Label>
                  <Textarea
                    id="love_story"
                    value={profile.love_story || ""}
                    onChange={(e) => updateField("love_story", e.target.value)}
                    placeholder="Cuenta cómo comenzó todo..."
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[120px] transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="couple_song" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    🎵 Nuestra Canción
                  </Label>
                  <Input
                    id="couple_song"
                    value={profile.couple_song || ""}
                    onChange={(e) => updateField("couple_song", e.target.value)}
                    placeholder="Ej: Perfect - Ed Sheeran"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg transition-all duration-300 group-hover:border-pink-300"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label
                    htmlFor="special_places"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-rose-400" />
                    Lugares Especiales
                  </Label>
                  <Textarea
                    id="special_places"
                    value={profile.special_places?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "special_places",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Playa del Carmen donde nos conocimos | Parque Central de nuestra primera cita | Café Luna donde nos comprometimos"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada lugar con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 md:col-span-2 group">
                  <Label
                    htmlFor="favorite_activities"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    🎯 Actividades que amamos hacer juntos
                  </Label>
                  <Textarea
                    id="favorite_activities"
                    value={profile.favorite_activities?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "favorite_activities",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Cocinar juntos los domingos | Ver películas de terror abrazados | Viajar a lugares nuevos | Bailar en la sala"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada actividad con " | " (barra vertical)</p>
                </div>
              </div>
            </div>

            {/* Sección: Detalles Adicionales */}
            <div className="space-y-8 border-b border-pink-100 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Detalles Adicionales</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 group">
                  <Label
                    htmlFor="dream_destinations"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    ✈️ Destinos de ensueño
                  </Label>
                  <Textarea
                    id="dream_destinations"
                    value={profile.dream_destinations?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "dream_destinations",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: París para nuestra luna de miel | Japón en primavera | Santorini al atardecer"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada destino con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="future_goals" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    🎯 Metas como pareja
                  </Label>
                  <Textarea
                    id="future_goals"
                    value={profile.future_goals?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "future_goals",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Comprar nuestra primera casa | Adoptar una mascota | Aprender a bailar salsa juntos"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada meta con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 group">
                  <Label
                    htmlFor="love_languages"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    💕 Lenguajes del amor
                  </Label>
                  <Textarea
                    id="love_languages"
                    value={profile.love_languages?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "love_languages",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Palabras de afirmación | Tiempo de calidad | Contacto físico | Actos de servicio | Regalos"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada lenguaje con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="pet_names" className="text-gray-700 font-semibold text-lg flex items-center gap-2">
                    🥰 Apodos cariñosos
                  </Label>
                  <Textarea
                    id="pet_names"
                    value={profile.pet_names?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "pet_names",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Mi amor | Corazón | Bebé | Princesa | Mi vida"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[100px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada apodo con " | " (barra vertical)</p>
                </div>

                <div className="space-y-3 md:col-span-2 group">
                  <Label
                    htmlFor="relationship_milestones"
                    className="text-gray-700 font-semibold text-lg flex items-center gap-2"
                  >
                    🏆 Hitos importantes de nuestra relación
                  </Label>
                  <Textarea
                    id="relationship_milestones"
                    value={profile.relationship_milestones?.join(" | ") || ""}
                    onChange={(e) =>
                      updateField(
                        "relationship_milestones",
                        e.target.value
                          .split(" | ")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Ej: Primera cita en el café Luna | Primer te amo en el parque | Mudarnos juntos | Conocer a nuestras familias"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl py-3 px-4 text-lg min-h-[120px] transition-all duration-300 group-hover:border-pink-300"
                  />
                  <p className="text-sm text-gray-500">Separa cada hito con " | " (barra vertical)</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-6 pt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-2 border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg rounded-2xl px-8 py-4 font-semibold text-lg"
              >
                <X className="h-5 w-5 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
