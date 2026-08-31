import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Heart,
  Star,
  Languages,
  ChefHat,
  Palette,
  Music,
  Headphones,
  Clapperboard,
  MapPin,
  Target,
  Plane,
  Trophy,
  MessageSquareHeart,
  PawPrint,
  Award,
  User,
  Save,
  Loader2,
  Film,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { AvatarUploader } from "@/components/AvatarUploader"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthProvider"
import { useCoupleMedia } from "@/hooks/useCoupleMedia"
import { useProfileEditor } from "@/hooks/useProfileEditor"
import { useDeviceTier } from "@/lib/useDeviceTier"
import { getTheme, SELECTABLE_THEMES } from "@/lib/profileThemes"
import { CanvasBoundary } from "@/components/three/CanvasBoundary"
import { ProfileThemeAmbient } from "./ProfileThemeAmbient"
import { ChipListEditor, InlineText, InlineTextarea } from "./editors"
import type { Profile } from "@/types"

type ChipKey =
  | "languages"
  | "favorite_foods"
  | "hobbies"
  | "favorite_songs"
  | "favorite_movies"
  | "special_places"
  | "favorite_activities"
  | "dream_destinations"
  | "future_goals"
  | "love_languages"
  | "pet_names"
  | "relationship_milestones"

const TASTE_CHIPS: { key: ChipKey; label: string; icon: React.ElementType; ph: string }[] = [
  { key: "languages", label: "Idiomas", icon: Languages, ph: "Español, 中文…" },
  { key: "favorite_foods", label: "Comidas favoritas", icon: ChefHat, ph: "Sushi, arepa…" },
  { key: "hobbies", label: "Pasatiempos", icon: Palette, ph: "Leer, bailar…" },
  { key: "favorite_songs", label: "Canciones favoritas", icon: Music, ph: "Yellow — Coldplay…" },
  { key: "favorite_movies", label: "Películas favoritas", icon: Clapperboard, ph: "The Notebook…" },
]

const US_CHIPS: { key: ChipKey; label: string; icon: React.ElementType; ph: string }[] = [
  { key: "special_places", label: "Lugares especiales", icon: MapPin, ph: "Café Luna…" },
  { key: "favorite_activities", label: "Actividades juntos", icon: Target, ph: "Cocinar los domingos…" },
  { key: "dream_destinations", label: "Destinos de ensueño", icon: Plane, ph: "Japón en primavera…" },
  { key: "future_goals", label: "Metas como pareja", icon: Trophy, ph: "Nuestra primera casa…" },
  { key: "love_languages", label: "Lenguajes del amor", icon: MessageSquareHeart, ph: "Tiempo de calidad…" },
  { key: "pet_names", label: "Apodos cariñosos", icon: PawPrint, ph: "Mi amor…" },
  { key: "relationship_milestones", label: "Hitos de la relación", icon: Award, ph: "Primer te amo…" },
]

interface ProfileExperienceProps {
  userId: string
  isCurrentUser: boolean
  initialProfile?: { name?: string; avatar_url?: string | null }
}

export const ProfileExperience: React.FC<ProfileExperienceProps> = ({ userId, isCurrentUser, initialProfile }) => {
  const { user, partner } = useAuth()
  const tier = useDeviceTier()
  const { draft, loading, saving, dirty, setField, save } = useProfileEditor(userId, isCurrentUser)

  const theme = getTheme(draft?.profile_theme)
  const editable = isCurrentUser

  // Películas/series compartidas (se mantiene la funcionalidad existente)
  const otherId = (isCurrentUser ? partner?.id : userId) || undefined
  const { media, addMedia, rateMedia } = useCoupleMedia(user?.id, otherId)
  const watched = (media ?? []).map((m) => {
    const iAmA = user?.id === m.userA
    return { id: m.id, title: m.title, your: iAmA ? m.ratingA : m.ratingB, partner: iAmA ? m.ratingB : m.ratingA }
  })
  const [newTitle, setNewTitle] = useState("")

  if (loading || !draft) {
    return (
      <div className={cn("flex min-h-[60vh] items-center justify-center", theme.pageBg)}>
        <Loader2 className="h-12 w-12 animate-spin text-white/80" />
      </div>
    )
  }

  const chip = (k: ChipKey) => (draft[k] as string[] | undefined) ?? []

  const Field: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; wide?: boolean }> = ({
    icon: Icon,
    label,
    children,
    wide,
  }) => (
    <div className={cn("rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md", wide && "sm:col-span-2")}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-white", theme.iconBg)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-white/70">{label}</span>
      </div>
      {children}
    </div>
  )

  const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ title, children, delay = 0 }) => (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-4"
    >
      <h3 className={cn("bg-gradient-to-r bg-clip-text text-2xl font-extrabold text-transparent", theme.headline)}>{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </motion.section>
  )

  return (
    <div className={cn("relative min-h-full overflow-hidden", theme.pageBg)}>
      {/* overlay + ambiente 3D temático */}
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.overlay }} />
      {tier === "full" && (
        <CanvasBoundary fallback={null}>
          <ProfileThemeAmbient motifs={theme.motifs} />
        </CanvasBoundary>
      )}

      <div className="relative z-10 space-y-10 p-6 sm:p-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left"
        >
          <div className="shrink-0">
            {editable ? (
              <AvatarUploader size="xl" onAvatarUpdate={(url) => setField("avatar_url", url)} />
            ) : (
              <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white/30 shadow-2xl sm:h-40 sm:w-40">
                {draft.avatar_url ? (
                  <img src={draft.avatar_url} alt={draft.name} className="h-full w-full object-cover" />
                ) : (
                  <UserAvatar name={draft.name || initialProfile?.name || "Usuario"} size="xl" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-1 text-4xl">{theme.flag}</div>
            {editable ? (
              <InlineText
                value={draft.name}
                editable
                onChange={(v) => setField("name", v)}
                placeholder="Tu nombre"
                ring={theme.ring}
                className="text-3xl font-extrabold sm:text-4xl"
              />
            ) : (
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{draft.name}</h2>
            )}
            <div className="mt-2">
              <InlineText
                value={draft.profession}
                editable={editable}
                onChange={(v) => setField("profession", v)}
                placeholder="Profesión"
                ring={theme.ring}
                className={cn("text-lg font-semibold", theme.accentText)}
              />
            </div>

            {/* selector de tema (solo edición) */}
            {editable && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {SELECTABLE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setField("profile_theme", t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition",
                      draft.profile_theme === t.id || (!draft.profile_theme && t.id === "default")
                        ? "border-white bg-white/25 text-white"
                        : "border-white/25 bg-white/10 text-white/70 hover:bg-white/20",
                    )}
                  >
                    {t.flag} {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.header>

        {/* Identidad */}
        <Section title="Identidad" delay={0.05}>
          <Field icon={Calendar} label="Cumpleaños">
            <InlineText value={draft.birthday} editable={editable} type="date" onChange={(v) => setField("birthday", v)} ring={theme.ring} />
          </Field>
          <Field icon={Heart} label="Se conocieron">
            <InlineText value={draft.meet_date} editable={editable} type="date" onChange={(v) => setField("meet_date", v)} ring={theme.ring} />
          </Field>
          <Field icon={Star} label="Gotcha Day">
            <InlineText value={draft.chinese_day} editable={editable} onChange={(v) => setField("chinese_day", v)} placeholder="2024-01-01" ring={theme.ring} />
          </Field>
        </Section>

        {/* Gustos */}
        <Section title="Gustos & pasiones" delay={0.05}>
          {TASTE_CHIPS.map((f) => (
            <Field key={f.key} icon={f.icon} label={f.label} wide={f.key === "favorite_movies"}>
              <ChipListEditor items={chip(f.key)} editable={editable} onChange={(n) => setField(f.key as keyof Profile, n as never)} placeholder={f.ph} chipClass={theme.chip} ring={theme.ring} />
            </Field>
          ))}
          <Field icon={Headphones} label="Género musical">
            <InlineText value={draft.favorite_music} editable={editable} onChange={(v) => setField("favorite_music", v)} placeholder="Pop, C-pop…" ring={theme.ring} />
          </Field>
        </Section>

        {/* Nosotros */}
        <Section title="Nosotros" delay={0.05}>
          <Field icon={Heart} label="Nuestra historia" wide>
            <InlineTextarea value={draft.love_story} editable={editable} onChange={(v) => setField("love_story", v)} placeholder="Cómo empezó todo…" ring={theme.ring} />
          </Field>
          <Field icon={Music} label="Nuestra canción">
            <InlineText value={draft.couple_song} editable={editable} onChange={(v) => setField("couple_song", v)} placeholder="Perfect — Ed Sheeran" ring={theme.ring} />
          </Field>
          {US_CHIPS.map((f) => (
            <Field key={f.key} icon={f.icon} label={f.label} wide={f.key === "relationship_milestones"}>
              <ChipListEditor items={chip(f.key)} editable={editable} onChange={(n) => setField(f.key as keyof Profile, n as never)} placeholder={f.ph} chipClass={theme.chip} ring={theme.ring} />
            </Field>
          ))}
        </Section>

        {/* Pelis juntos (compartido) */}
        <Section title="Vistas juntos 🍿" delay={0.05}>
          <Field icon={Film} label="Películas y series" wide>
            {otherId && (
              <div className="mb-3 flex gap-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitle.trim()) {
                      addMedia({ title: newTitle.trim(), myRating: null })
                      setNewTitle("")
                    }
                  }}
                  placeholder="Añadir peli/serie…"
                  className={cn("flex-1 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/45 focus-visible:ring-2", theme.ring)}
                />
                <Button
                  onClick={() => {
                    if (newTitle.trim()) {
                      addMedia({ title: newTitle.trim(), myRating: null })
                      setNewTitle("")
                    }
                  }}
                  className={cn("rounded-full bg-gradient-to-r", theme.button)}
                >
                  Añadir
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {watched.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{m.title}</p>
                    <p className="text-xs text-white/60">
                      Tú: {m.your ?? "—"} · Pareja: {m.partner ?? "—"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => rateMedia({ id: m.id, rating: n })}
                        className="rounded-full bg-white/15 px-2 py-0.5 text-xs text-white hover:bg-white/30"
                      >
                        {n}★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {watched.length === 0 && <p className="text-sm text-white/50">Aún nada. ¡Añadan su primera peli juntos!</p>}
            </div>
          </Field>
        </Section>
      </div>

      {/* Barra de guardado (solo edición) */}
      {editable && (
        <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-white/15 bg-black/20 p-4 backdrop-blur-md">
          <Button
            onClick={save}
            disabled={saving || !dirty}
            className={cn("rounded-full bg-gradient-to-r px-6 font-semibold shadow-lg", theme.button)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {dirty ? "Guardar cambios" : "Guardado"}
          </Button>
        </div>
      )}
    </div>
  )
}
