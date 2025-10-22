"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider" // Importar useAuth

import {
  Dialog, DialogContent, DialogTrigger, DialogClose,
  DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

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
  MapPin,
  Plane,
  Target,
  MessageSquareHeart,
  PawPrint,
  Trophy,
  User,
  Users,
} from "lucide-react"

interface ProfileModalProps {
  userId: string
  fallbackColor?: string
  isCurrentUser?: boolean
  initialProfile?: { name?: string; avatar_url?: string | null }

}

interface WatchedMediaItem {
  title: string
  your_rating: number | null
  partner_rating: number | null
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userId,
  fallbackColor,
  isCurrentUser = false,
  initialProfile, // 👈 NUEVO
}) => {
  const { user, partner, profile: selfProfile } = useAuth() // Obtener el usuario actual y su pareja
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    // 🚫 No hagas nada si el modal está cerrado
    if (!isOpen) return;

    // Vamos a cargar datos solo lo necesario
    const run = async () => {
      setLoading(true);

      let mainProfileData: any = null;
      let partnerProfileData: any = null;

      // ✅ Si estoy viendo MI perfil y ya tengo selfProfile del AuthProvider,
      // no consultes a la red para el principal.
      const viewingOwnProfile = isCurrentUser && user?.id === userId;
      if (viewingOwnProfile && selfProfile) {
        mainProfileData = selfProfile;
      } else {
        // Perfil principal (otra persona o no hay selfProfile aún)
        const { data: mainData, error: mainError } = await supabase
          .from("profiles")
          .select(`
          id, name, avatar_url, birthday, meet_date, chinese_day,
          languages, profession, favorite_foods, hobbies,
          favorite_music, favorite_songs, favorite_movies,
          love_story, couple_song, special_places, favorite_activities,
          dream_destinations, future_goals, love_languages, pet_names, relationship_milestones,
          watched_media
        `)
          .eq("id", userId)
          .single();

        if (mainError) {
          console.error("Error fetching main profile:", mainError);
          setLoading(false);
          return;
        }
        mainProfileData = mainData;
      }

      // Solo si es MI perfil y tengo pareja: trae watched_media de la pareja
      if (viewingOwnProfile && partner?.id) {
        const { data: partnerData, error: partnerError } = await supabase
          .from("profiles")
          .select("watched_media")
          .eq("id", partner.id)
          .single();

        if (!partnerError) {
          partnerProfileData = partnerData;
        } else {
          console.warn("Error fetching partner profile for watched media:", partnerError);
        }
      }

      // Combinar watched_media (misma lógica de antes)
      const combined = new Map<string, { title: string; your_rating: number | null; partner_rating: number | null }>();

      if (mainProfileData?.watched_media) {
        for (const item of mainProfileData.watched_media) {
          combined.set(item.title.toLowerCase(), {
            title: item.title,
            your_rating: item.your_rating,
            partner_rating: item.partner_rating,
          });
        }
      }

      if (partnerProfileData?.watched_media) {
        for (const item of partnerProfileData.watched_media) {
          const k = item.title.toLowerCase();
          const prev = combined.get(k);
          if (prev) {
            prev.partner_rating = item.your_rating;
          } else {
            combined.set(k, {
              title: item.title,
              your_rating: item.partner_rating ?? null,
              partner_rating: item.your_rating ?? null,
            });
          }
        }
      }

      setProfile({
        ...mainProfileData,
        watched_media: Array.from(combined.values()),
      });
      setLoading(false);
    };

    run();
  }, [
    isOpen,         // 👈 solo cuando se abre el modal
    userId,
    isCurrentUser,
    user?.id,
    partner?.id,
    selfProfile,    // 👈 para rehidratación si cambia el profile del AuthProvider
  ]);


  const renderViewField = (
    icon: React.ElementType,
    label: string,
    value: string | string[] | WatchedMediaItem[] | undefined,
    gradient?: string,
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null
    const IconComponent = icon
    const gradientClass = gradient || "from-pink-400 to-rose-500"

    let content
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object" && "title" in value[0]) {
        content = (
          <div className="flex flex-col gap-2">
            {(value as WatchedMediaItem[]).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-pink-100/50 px-3 py-2 rounded-lg border border-pink-200"
              >
                <span className="font-medium text-gray-800">{item.title}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-pink-500" /> {item.your_rating || "N/A"}{" "}
                    <Star className="h-3 w-3 text-yellow-500" />
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-rose-500" /> {item.partner_rating || "N/A"}{" "}
                    <Star className="h-3 w-3 text-yellow-500" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      } else {
        content = (
          <div className="flex flex-wrap gap-2">
            {(value as string[]).map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border border-pink-200"
              >
                {item}
              </span>
            ))}
          </div>
        )
      }
    } else {
      content = <p className="text-gray-700 font-semibold text-lg">{value}</p>
    }

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
            {content}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100 to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
      </div>
    )
  }

  const ParticleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <Heart
            key={`heart-${i}`}
            className={`absolute text-pink-300/40 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
            }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className={`absolute text-yellow-300/30 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 8}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className={`absolute text-pink-400/30 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 18 + 12}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${Math.random() * 6 + 4}s`,
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
            <UserAvatar
              // 👇 usa los datos iniciales para que el avatar se vea siempre
              name={initialProfile?.name || "Usuario"}
              avatarUrl={initialProfile?.avatar_url || undefined}
              size="xl"
              fallbackColor={fallbackColor}
            />
          </span>
        </DialogTrigger>

        <DialogContent className="w-[500px] bg-gradient-to-br from-pink-50 to-white rounded-3xl p-8 shadow-2xl border-0 overflow-hidden">
          <DialogHeader className="sr-only"> {/* quita sr-only si los quieres visibles */}
            <DialogTitle>Perfil de {profile?.name ?? "Usuario"}</DialogTitle>
            <DialogDescription>
              Información del perfil, gustos y medios vistos.
            </DialogDescription>
          </DialogHeader>

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
            // 👇 muestra inmediatamente el avatar con initialProfile (y si luego hay profile, mejor)
            name={profile?.name || initialProfile?.name || "Usuario"}
            avatarUrl={(profile?.avatar_url ?? initialProfile?.avatar_url) || undefined}
            size="xl"
            fallbackColor={fallbackColor}
          />
        </span>
      </DialogTrigger>

      <DialogContent className="w-[1200px] max-w-[95vw] h-[90vh] overflow-hidden bg-gradient-to-br from-white via-pink-50 to-rose-50 rounded-3xl p-0 shadow-2xl border-0">
        <DialogClose asChild>
          <button className="absolute top-6 right-6 z-50 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-full shadow-2xl group-hover:shadow-pink-500/50 transition-all duration-500 flex items-center justify-center group-hover:scale-125 group-hover:rotate-180 border-2 border-white">
                <X className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-0 group-hover:opacity-30 animate-ping"></div>
              <div className="absolute inset-0 w-14 h-14 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce" />
              <Heart className="absolute -bottom-1 -left-1 h-3 w-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            </div>
          </button>
        </DialogClose>

        <ParticleBackground />

        <div className="h-full overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-8">
            <div className="flex gap-8 mb-8">
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
                {isCurrentUser && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate("/edit-profile")}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>
                )}
              </div>
            </div>

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
                {renderViewField(Calendar, "Gotcha Day", profile.chinese_day, "from-red-400 to-pink-500")}
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
                {renderViewField(Heart, "Historia de Amor", profile.love_story, "from-red-400 to-pink-500")}
                {renderViewField(Headphones, "Nuestra Canción", profile.couple_song, "from-blue-400 to-purple-500")}
                {renderViewField(MapPin, "Lugares Especiales", profile.special_places, "from-green-400 to-teal-500")}
                {renderViewField(
                  Target,
                  "Actividades Juntos",
                  profile.favorite_activities,
                  "from-yellow-400 to-orange-500",
                )}
                {renderViewField(Plane, "Destinos de Ensueño", profile.dream_destinations, "from-cyan-400 to-blue-500")}
                {renderViewField(Trophy, "Metas como Pareja", profile.future_goals, "from-purple-400 to-indigo-500")}
                {renderViewField(
                  MessageSquareHeart,
                  "Lenguajes del Amor",
                  profile.love_languages,
                  "from-pink-400 to-rose-500",
                )}
                {renderViewField(PawPrint, "Apodos Cariñosos", profile.pet_names, "from-orange-400 to-red-500")}
                {renderViewField(
                  Trophy,
                  "Hitos de la Relación",
                  profile.relationship_milestones,
                  "from-teal-400 to-green-500",
                )}
                {renderViewField(
                  Clapperboard, // Usamos Clapperboard para películas/series
                  "Películas/Series Vistas Juntos",
                  profile.watched_media,
                  "from-blue-400 to-purple-500",
                )}
              </div>
            </div>

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
    </Dialog>
  )
}
