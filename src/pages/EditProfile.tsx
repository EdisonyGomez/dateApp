"use client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label" // Importamos Label
import { AvatarUploader } from "@/components/AvatarUploader"
import { Heart, ArrowLeft, User, Calendar, Music, Film, BookOpen, Utensils, Smile } from "lucide-react" // Más íconos para las secciones
import { useAuth } from "@/contexts/AuthProvider"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()
      if (!error) setProfile(data)
      setLoading(false)
    }
    if (user?.id) fetchProfile()
  }, [user?.id])

  const updateField = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase.from("profiles").update(profile).eq("id", user?.id)
    setLoading(false)
    if (error) {
      toast.error("Error al actualizar el perfil. Por favor, inténtalo de nuevo.")
    } else {
      toast.success("¡Perfil actualizado con éxito!")
      navigate("/") // Asumiendo que '/' es el dashboard
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Heart className="h-12 w-12 text-pink-500 mb-4 animate-pulse" />
        <p className="text-lg text-gray-700 font-medium">Cargando tu espacio personal...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4 transition-all duration-500 ease-in-out">
      {/* Botón "Regresar al Dashboard" */}
      <Button
        variant="outline"
        onClick={() => navigate("/")}
        className="mb-6 self-start md:self-center transition-all duration-300 ease-in-out hover:translate-x-[-4px] hover:shadow-md hover:border-pink-300 text-gray-700 hover:text-pink-600 bg-transparent"
        aria-label="Regresar al Dashboard"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Regresar al Dashboard
      </Button>

      <Card className="w-full max-w-2xl rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 animate-fade-in transition-all duration-500 ease-in-out">
        <CardHeader className="text-center space-y-4 pt-8">
          <Heart className="h-12 w-12 text-pink-500 mb-2 animate-pulse mx-auto" />
          <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Personaliza tu Perfil
          </CardTitle>
          <CardDescription className="text-xl text-gray-600 font-medium">
            Haz que tu perfil refleje tu historia única y tus momentos más preciados.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          {/* Sección: Tu Foto de Perfil */}
          <div className="space-y-4 text-center border-b border-pink-100 pb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-purple-500" /> Tu Foto de Perfil
            </h3>
            <p className="text-base text-gray-500">Elige una imagen especial que te represente.</p>
            <div className="flex justify-center py-4">
              <AvatarUploader />
            </div>
          </div>

          {/* Sección: Información Personal */}
          <div className="space-y-6 border-b border-pink-100 pb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-pink-500" /> Detalles Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">
                  Tu Nombre
                </Label>
                <Input
                  id="name"
                  value={profile.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ej: Melo"
                  className="input-field-style"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-gray-700 font-semibold">
                  Fecha de Cumpleaños
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profile.birthday || ""}
                  onChange={(e) => updateField("birthday", e.target.value)}
                  className="input-field-style"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meet_date" className="text-gray-700 font-semibold">
                  Día que se conocieron
                </Label>
                <Input
                  id="meet_date"
                  type="date"
                  value={profile.meet_date || ""}
                  onChange={(e) => updateField("meet_date", e.target.value)}
                  className="input-field-style"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chinese_day" className="text-gray-700 font-semibold">
                  Día Chino (si aplica)
                </Label>
                <Input
                  id="chinese_day"
                  value={profile.chinese_day || ""}
                  onChange={(e) => updateField("chinese_day", e.target.value)}
                  placeholder="Ej: 2024-01-01"
                  className="input-field-style"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profession" className="text-gray-700 font-semibold">
                  Profesión
                </Label>
                <Input
                  id="profession"
                  value={profile.profession || ""}
                  onChange={(e) => updateField("profession", e.target.value)}
                  placeholder="Ej: Desarrollador de Software"
                  className="input-field-style"
                />
              </div>
            </div>
          </div>

          {/* Sección: Gustos e Intereses */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Smile className="h-6 w-6 text-pink-500" /> Tus Gustos y Pasatiempos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="languages" className="text-gray-700 font-semibold">
                  <BookOpen className="inline-block h-4 w-4 mr-1 text-purple-400" /> Idiomas que hablas
                </Label>
                <Textarea
                  id="languages"
                  value={profile.languages?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "languages",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="Ej: Español, Inglés, Francés"
                  className="input-field-style min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favorite_foods" className="text-gray-700 font-semibold">
                  <Utensils className="inline-block h-4 w-4 mr-1 text-pink-400" /> Comidas favoritas (ordenadas)
                </Label>
                <Textarea
                  id="favorite_foods"
                  value={profile.favorite_foods?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "favorite_foods",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="Ej: Pizza, Sushi, Tacos"
                  className="input-field-style min-h-[80px]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hobbies" className="text-gray-700 font-semibold">
                  <Heart className="inline-block h-4 w-4 mr-1 text-purple-400" /> Pasatiempos
                </Label>
                <Textarea
                  id="hobbies"
                  value={profile.hobbies?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "hobbies",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="Ej: Leer, Caminar, Cocinar"
                  className="input-field-style min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favorite_music" className="text-gray-700 font-semibold">
                  <Music className="inline-block h-4 w-4 mr-1 text-pink-400" /> Género musical favorito
                </Label>
                <Input
                  id="favorite_music"
                  value={profile.favorite_music || ""}
                  onChange={(e) => updateField("favorite_music", e.target.value)}
                  placeholder="Ej: Pop, Rock, Clásica"
                  className="input-field-style"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favorite_songs" className="text-gray-700 font-semibold">
                  <Music className="inline-block h-4 w-4 mr-1 text-purple-400" /> Canciones favoritas
                </Label>
                <Textarea
                  id="favorite_songs"
                  value={profile.favorite_songs?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "favorite_songs",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="Ej: Song A, Song B, Song C"
                  className="input-field-style min-h-[80px]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="favorite_movies" className="text-gray-700 font-semibold">
                  <Film className="inline-block h-4 w-4 mr-1 text-pink-400" /> Películas favoritas
                </Label>
                <Textarea
                  id="favorite_movies"
                  value={profile.favorite_movies?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "favorite_movies",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  placeholder="Ej: Movie X, Movie Y, Movie Z"
                  className="input-field-style min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="button-outline-style transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
