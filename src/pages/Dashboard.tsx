"use client"

import type React from "react"
import { useState, useMemo, useEffect, lazy, Suspense } from "react"
import { useAuth } from "@/contexts/AuthProvider"
import { useDiaryEntries } from "@/hooks/useDiaryEntries"
import { Header } from "@/components/Header"
import { DiaryForm } from "@/components/DiaryForm"
import { DiaryEntry as DiaryEntryComponent } from "@/components/DiaryEntry"
import { PartnerLinkForm } from "@/components/PartnerLinkForm"
import { SearchBar } from "@/components/SearchBar"
import { CoupleGames } from "@/components/CoupleGames"
import { SharedCalendar } from "@/components/SharedCalendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DiaryEntry as DiaryEntryType } from "@/types"
import { toast } from "sonner"
import { Calendar, Heart, BookOpen, CalendarDays, Smile, ChevronDown, RefreshCw, X } from "lucide-react"
import { HeartParticles } from "@/components/HeartParticles"
import { RomanticBackground } from "@/components/RomanticBackground" // 👈 nuevo import
import { Reveal3D } from "@/components/motion/Reveal3D"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useDeviceTier } from "@/lib/useDeviceTier"

import { CanvasBoundary } from "@/components/three/CanvasBoundary"

// Lazy: el bundle de three solo se descarga en tier 'full'
const AmbientHearts = lazy(() =>
  import("@/components/three/AmbientHearts").then((m) => ({ default: m.AmbientHearts })),
)


const ENTRIES_PAGE_SIZE = 6

/**
 * Dashboard principal:
 * - Gestiona pestañas (diario, calendario, juegos)
 * - Filtra/busca entradas
 * - Maneja modos de lectura (timeline / dueto)
 * - Integra el fondo romántico y partículas de corazones
 */
export const Dashboard: React.FC = () => {
  const { user, partner } = useAuth()
  const tier = useDeviceTier()
  const { entries, loading, addEntry, updateEntry, deleteEntry, getEntryByDate } = useDiaryEntries()
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntryType | null>(null)
  const [showPartnerLink, setShowPartnerLink] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [filterMood, setFilterMood] = useState<"all" | string>("all")

  const [readingMode, setReadingMode] = useState<"timeline" | "duet">("timeline")

  const normalizeDate = (date: string | Date) => new Date(date).toISOString().split("T")[0]

  // Número de entradas visibles para evitar sobrecargar la pantalla
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PAGE_SIZE)

const { refreshEntries, refreshing } = useDiaryEntries()

  const filteredEntries = useMemo(() => {
    let filtered = entries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q))
    }
    if (selectedDate) {
      filtered = filtered.filter((e) => normalizeDate(e.date) === normalizeDate(selectedDate))
    }
    if (filterMood !== "all") {
      filtered = filtered.filter((e) => e.mood === filterMood)
    }
    return filtered
  }, [entries, searchQuery, selectedDate, filterMood])

  // Entradas que realmente se muestran en pantalla (paginación en memoria)
  const displayedEntries = useMemo(
    () => filteredEntries.slice(0, visibleCount),
    [filteredEntries, visibleCount]
  )

  const hasMoreEntries = displayedEntries.length < filteredEntries.length

  // Cada vez que cambien filtros/modo de lectura, reseteamos el contador
  useEffect(() => {
    setVisibleCount(ENTRIES_PAGE_SIZE)
  }, [searchQuery, selectedDate, filterMood, readingMode])

  // Recalcular posiciones de los scroll-reveals cuando cambia el layout
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [visibleCount, readingMode])


  const today = normalizeDate(new Date())
  const todayEntry = getEntryByDate(today)
  const partnerTodayEntry = partner ? getEntryByDate(today, partner.id) : null

  /**
   * Guarda una entrada nueva o actualiza una existente.
   */
  const handleSaveEntry = (data: Omit<DiaryEntryType, "id" | "createdAt" | "updatedAt">) => {
    console.log("Saving entry:", data)
    try {
      if (editingEntry) {
        updateEntry(editingEntry.id, data)
        toast.success("Entry updated successfully!")
        setEditingEntry(null)
      } else {
        addEntry(data)
        toast.success("Entry saved successfully!")
      }
      setShowForm(false)
    } catch {
      toast.error("Failed to save entry")
    }
  }

  /**
   * Formatea una fecha YYYY-MM-DD a formato largo en español.
   */
  const formatFullDate = (dateStr: string): string => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    const dayName = days[date.getDay()]
    const monthName = months[month - 1]
    return `${dayName} ${day} de ${monthName} del ${year}`
  }

  const handleEditEntry = (e: DiaryEntryType) => {
    setEditingEntry(e)
    setShowForm(true)
  }

  const handleNewEntry = () => {
    setEditingEntry(null)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingEntry(null)
  }

  const handleDeleteEntry = async (entry: DiaryEntryType) => {
    try {
      await deleteEntry(entry.id)
      toast.success("Entry deleted successfully")
    } catch {
      toast.error("Failed to delete entry")
    }
  }

  // ───────────────── ESTADO: CARGANDO ─────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-rose-100 relative overflow-hidden">
        <RomanticBackground />
        <HeartParticles />
        <div className="flex items-center gap-4 relative z-10">
          <Heart className="h-16 w-16 text-rose-500 animate-pulse-slow-fade mx-auto" />
          <p className="text-pink-800 text-lg ml-4">Cargando tu diario...</p>
        </div>
      </div>
    )
  }

  // ───────────────── ESTADO: VINCULAR PAREJA ─────────────────
  if (showPartnerLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 p-4 custom-scrollbar relative overflow-hidden">
        <RomanticBackground />
        <HeartParticles />
        <div className="container mx-auto max-w-4xl rounded-3xl border border-pink-100 bg-white/70 p-4 shadow-xl backdrop-blur-sm animate-fade-in relative z-10 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-extrabold text-rose-500">Conecta con tu Pareja</h1>
            <Button
              variant="outline"
              onClick={() => setShowPartnerLink(false)}
              className="px-6 py-3 rounded-xl shadow-md border-pink-200 text-pink-700 hover:bg-pink-50 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
              ← Volver al Diario
            </Button>
          </div>
          <PartnerLinkForm />
        </div>
      </div>
    )
  }

  // ───────────────── ESTADO: FORMULARIO (NUEVO / EDITAR) ─────────────────
  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 p-4 custom-scrollbar relative overflow-hidden">
        <RomanticBackground />
        <HeartParticles />
        <div className="container mx-auto max-w-4xl bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-pink-100 animate-fade-in relative z-10">
          <Button
            variant="outline"
            onClick={handleCancelForm}
            className="mb-6 px-6 py-3 rounded-xl shadow-md border-pink-200 text-pink-700 hover:bg-pink-50 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-transparent"
          >
            ← Volver al Diario
          </Button>
          <DiaryForm entry={editingEntry || undefined} onSave={handleSaveEntry} onCancel={handleCancelForm} />
        </div>
      </div>
    )
  }

  // ───────────────── DASHBOARD PRINCIPAL ─────────────────
  return (
    <div className="relative min-h-screen overflow-hidden custom-scrollbar">
      {/* Fondo romántico + capa ambiental (3D en 'full', 2D en el resto) */}
      <RomanticBackground />
      {tier === "full" ? (
        <CanvasBoundary fallback={<HeartParticles />}>
          <Suspense fallback={<HeartParticles />}>
            <AmbientHearts />
          </Suspense>
        </CanvasBoundary>
      ) : (
        <HeartParticles />
      )}

      <Header onNewEntry={handleNewEntry} onShowPartnerLink={() => setShowPartnerLink(true)} />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <Tabs defaultValue="diary" className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-pink-50 rounded-2xl shadow-lg border border-pink-100 p-1">
            <TabsTrigger
              value="diary"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-xl transition-all duration-300 ease-in-out text-pink-700 font-semibold text-lg py-2 rounded-xl hover:text-rose-600 hover:scale-105"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Diary
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-xl transition-all duration-300 ease-in-out text-pink-700 font-semibold text-lg py-2 rounded-xl hover:text-rose-600 hover:scale-105"
            >
              <CalendarDays className="h-5 w-5 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-xl transition-all duration-300 ease-in-out text-pink-700 font-semibold text-lg py-2 rounded-xl hover:text-rose-600 hover:scale-105"
            >
              <Heart className="h-5 w-5 mr-2" />
              Games
            </TabsTrigger>
          </TabsList>

          {/* ───────────── DIARY TAB ───────────── */}
          <TabsContent
            value="diary"
            className="space-y-8 animate-fade-in relative bg-transparent"
          >

            {/* Search & Filters */}
            <Card className="relative overflow-hidden p-5 sm:p-6 rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm">
              {/* Filo de acento superior */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
              <CardContent className="p-0 space-y-4">
                <SearchBar onSearch={setSearchQuery} placeholder="Busca en tus entradas del diario..." />

                {/* Filtros: fecha + ánimo en grid de 2 columnas (no se desborda en móvil) */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50/60 px-3 py-2.5 shadow-sm transition-all duration-300 focus-within:border-rose-300 focus-within:ring-1 focus-within:ring-rose-300 hover:bg-pink-100/60">
                    <CalendarDays className="h-4 w-4 shrink-0 text-rose-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full min-w-0 cursor-pointer bg-transparent text-sm text-pink-800 outline-none [color-scheme:light]"
                    />
                  </label>
                  <div className="relative flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50/60 px-3 py-2.5 shadow-sm transition-all duration-300 focus-within:border-rose-300 focus-within:ring-1 focus-within:ring-rose-300 hover:bg-pink-100/60">
                    <Smile className="h-4 w-4 shrink-0 text-rose-400" />
                    <select
                      value={filterMood}
                      onChange={(e) => setFilterMood(e.target.value)}
                      className="w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-5 text-sm text-pink-800 outline-none"
                    >
                      <option value="all">Todos los Ánimos</option>
                      <option value="happy">😊 Feliz</option>
                      <option value="sad">😢 Triste</option>
                      <option value="excited">🤩 Emocionado</option>
                      <option value="calm">😌 Tranquilo</option>
                      <option value="stressed">😰 Estresado</option>
                      <option value="grateful">🙏 Agradecido</option>
                      <option value="neutral">😐 Neutral</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-pink-400" />
                  </div>

                  {(searchQuery || selectedDate || filterMood !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedDate("")
                        setFilterMood("all")
                      }}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white/70 px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-50 hover:shadow-md"
                    >
                      <X className="h-4 w-4" /> Limpiar filtros
                    </button>
                  )}
                </div>

                {/* Modo de lectura (segmented control) + recargar */}
                <div className="flex items-center gap-3">
                  <div className="relative grid flex-1 grid-cols-2 gap-1 rounded-2xl border border-pink-100 bg-pink-50/70 p-1">
                    <span
                      aria-hidden
                      className={`absolute inset-y-1 left-1 right-1/2 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-md shadow-rose-500/40 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                        readingMode === "duet" ? "translate-x-full" : "translate-x-0"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setReadingMode("timeline")}
                      className={`relative z-10 rounded-xl py-2 text-sm font-bold transition-colors duration-300 ${
                        readingMode === "timeline" ? "text-white" : "text-pink-600 hover:text-rose-600"
                      }`}
                    >
                      Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingMode("duet")}
                      className={`relative z-10 rounded-xl py-2 text-sm font-bold transition-colors duration-300 ${
                        readingMode === "duet" ? "text-white" : "text-pink-600 hover:text-rose-600"
                      }`}
                    >
                      Dueto
                    </button>
                  </div>

                  {/* Recargar la lista sin recargar la página */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={refreshing}
                    aria-label="Recargar entradas"
                    title="Recargar entradas"
                    onClick={async () => {
                      setVisibleCount(ENTRIES_PAGE_SIZE)
                      setSearchQuery("")
                      setSelectedDate("")
                      setFilterMood("all")
                      await refreshEntries()
                      toast.success("Entradas actualizadas ✅")
                    }}
                    className="h-11 w-11 shrink-0 rounded-2xl border-pink-100 bg-white/80 text-rose-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-50 hover:text-rose-600 hover:shadow-md disabled:opacity-60"
                  >
                    <RefreshCw className={refreshing ? "animate-spin" : ""} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Entries List */}
            <div className="space-y-6 relative">
              <div className="relative">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-rose-500/90">
                  Tu diario
                </span>
                <div className="mt-1 flex items-center gap-3">
                  <div className="shrink-0 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 p-3 shadow-lg shadow-rose-500/30 transition-transform duration-300 hover:rotate-6">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="bg-gradient-to-br from-rose-700 via-rose-600 to-pink-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent [text-shadow:0_1px_0_rgba(255,255,255,0.35)] sm:text-4xl">
                    {readingMode === "timeline" ? "Diary Entries" : "Vista Dueto"}
                  </h2>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 px-3 py-1.5 text-sm font-extrabold text-white shadow-lg shadow-rose-500/40">
                    <Heart className="h-3.5 w-3.5 animate-heartbeat fill-current" />
                    {filteredEntries.length}
                  </span>
                </div>
                <div className="animate-shimmer mt-2 ml-[3.75rem] h-[3px] w-20 rounded-full bg-[linear-gradient(90deg,#e11d48,#ec4899,#e11d48)] bg-[length:200%_100%]" />
              </div>

              {/* Vacío */}
              {filteredEntries.length === 0 ? (
                <Card className="rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
                  <CardContent className="p-10 text-center">
                    <Heart className="h-16 w-16 text-pink-400 mx-auto mb-6 opacity-80 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-3 text-rose-500">No se encontraron entradas</h3>
                    <p className="text-pink-700 mb-6 text-lg">
                      {searchQuery || selectedDate || filterMood !== "all"
                        ? "Intenta ajustar tu búsqueda o filtros para encontrar tus recuerdos."
                        : "¡Es hora de escribir la primera página de tu diario de amor!"}
                    </p>
                    <Button
                      onClick={handleNewEntry}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 animate-ping-on-hover"
                    >
                      Write Your First Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {readingMode === "timeline" && (
                    /* === MODO TIMELINE === */
                    Object.entries(
                      displayedEntries.reduce((groups, entry) => {
                        const date = entry.date
                        if (!groups[date]) groups[date] = []
                        groups[date].push(entry)
                        return groups
                      }, {} as Record<string, DiaryEntryType[]>)
                    ).map(([date, entries]) => (
                      <div key={date} className="mb-8">
                        <div className="flex items-center justify-center">
                          <h3 className="text-xl text-center font-bold mb-4 text-pink-700 bg-pink-50/60 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center shadow-md border border-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-lg justify-center">
                            <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                            {formatFullDate(date)}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start" style={{ perspective: 1200 }}>
                          {entries.map((entry) => (
                            <Reveal3D key={entry.id}>
                              <DiaryEntryComponent entry={entry} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />
                            </Reveal3D>
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  {readingMode === "duet" && (
                    /* === MODO DUETO === */
                    Object.entries(
                      displayedEntries.reduce((groups, entry) => {
                        const date = entry.date
                        if (!groups[date]) groups[date] = []
                        groups[date].push(entry)
                        return groups
                      }, {} as Record<string, DiaryEntryType[]>)
                    ).map(([date, entries]) => {
                      const myEntry = entries.find((e) => e.userId === user?.id)
                      const partnerEntry = partner ? entries.find((e) => e.userId === partner.id) : null

                      return (
                        <div key={date} className="mb-8">
                          <div className="flex items-center justify-center">
                            <h3 className="text-xl text-center font-bold mb-4 text-pink-700 bg-pink-50/60 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center shadow-md border border-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-lg justify-center">
                              <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                              {formatFullDate(date)}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Columna: Tú */}
                            <Card className="rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm p-4">
                              <div className="text-sm font-semibold text-rose-600 mb-3">Tú</div>
                              {myEntry ? (
                                <Reveal3D parallax={false}>
                                  <DiaryEntryComponent entry={myEntry} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />
                                </Reveal3D>
                              ) : (
                                <div className="text-sm text-pink-800/80">No escribiste este día.</div>
                              )}
                            </Card>

                            {/* Columna: Pareja */}
                            <Card className="rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm p-4">
                              <div className="text-sm font-semibold text-rose-600 mb-3">Pareja</div>
                              {partner ? (
                                partnerEntry ? (
                                  <Reveal3D parallax={false}>
                                    <DiaryEntryComponent entry={partnerEntry} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />
                                  </Reveal3D>
                                ) : (
                                  <div className="text-sm text-pink-800/80">Tu pareja no ha escrito este día.</div>
                                )
                              ) : (
                                <div className="text-sm text-pink-800/80">
                                  Aún no has vinculado a tu pareja.{" "}
                                  <button
                                    className="text-rose-600 underline"
                                    onClick={() => setShowPartnerLink(true)}
                                  >
                                    Vincular ahora
                                  </button>
                                </div>
                              )}
                            </Card>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {/* Fade-out + botón de cargar más */}
                  {hasMoreEntries && (
                    <div className="mt-4 pt-8 flex flex-col items-center relative">
                      {/* Capa de degradado para el fade-out visual */}
                      <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-t from-rose-50/95 via-rose-50/40 to-transparent" />

                      <Button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + ENTRIES_PAGE_SIZE)}
                        className="relative z-10 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:scale-105"
                      >
                        Cargar más recuerdos
                      </Button>
                      <p className="mt-2 text-xs text-pink-800/70 relative z-10">
                        Mostrando {displayedEntries.length} de {filteredEntries.length} entradas
                      </p>
                    </div>
                  )}
                </>

              )}
            </div>
          </TabsContent>

          {/* ───────────── CALENDAR TAB ───────────── */}
          <TabsContent value="calendar" className="animate-fade-in">
            <SharedCalendar />
          </TabsContent>

          {/* ───────────── GAMES TAB ───────────── */}
          <TabsContent value="games" className="animate-fade-in">
            <Card className="p-8 rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <CoupleGames />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #ffe4e6, #fff0f5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f472b6, #ec4899);
          border-radius: 10px;
          border: 3px solid #ffe4e6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ec4899, #db2777);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f472b6 #ffe4e6;
        }
        @keyframes pulse-slow-fade {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        .animate-pulse-slow-fade {
          animation: pulse-slow-fade 3s infinite ease-in-out;
        }
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
        .animate-ping-on-hover:hover {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          12% { transform: scale(1.22); }
          24% { transform: scale(1); }
          36% { transform: scale(1.14); }
          50% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2.6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-heartbeat,
          .animate-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
