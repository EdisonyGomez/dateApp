import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useDiaryEntries } from '@/hooks/useDiaryEntries'
import { Header } from '@/components/Header'
import { DiaryForm } from '@/components/DiaryForm'
import { DiaryEntry as DiaryEntryComponent } from '@/components/DiaryEntry'
import { PartnerLinkForm } from '@/components/PartnerLinkForm'
import { SearchBar } from '@/components/SearchBar'
import { CoupleGames } from '@/components/CoupleGames'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { DiaryEntry as DiaryEntryType } from '@/types'
import { toast } from 'sonner'
import {
  Calendar,
  Heart,
  BookOpen
} from 'lucide-react'
import { LoveNoteModal } from '@/components/LoveNoteModal'
import { HeartParticles } from '@/components/HeartParticles'

export const Dashboard: React.FC = () => {
  const { user, partner } = useAuth()
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate
  } = useDiaryEntries()

  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntryType | null>(null)
  const [showPartnerLink, setShowPartnerLink] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [filterMood, setFilterMood] = useState<'all' | string>('all')

  const normalizeDate = (date: string | Date) =>
    new Date(date).toISOString().split('T')[0]

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q)
      )
    }
    if (selectedDate) {
      filtered = filtered.filter(e => normalizeDate(e.date) === normalizeDate(selectedDate))
    }
    if (filterMood !== 'all') {
      filtered = filtered.filter(e => e.mood === filterMood)
    }
    return filtered
  }, [entries, searchQuery, selectedDate, filterMood])

  const today = normalizeDate(new Date())
  const todayEntry = getEntryByDate(today)
  const partnerTodayEntry = partner
    ? getEntryByDate(today, partner.id)
    : null

  const handleSaveEntry = (data: Omit<DiaryEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Saving entry:', data) // 👈 revisa si el date es el nuevo

    try {
      if (editingEntry) {
        updateEntry(editingEntry.id, data)
        toast.success('Entry updated successfully!')
        setEditingEntry(null)
      } else {
        addEntry(data)
        toast.success('Entry saved successfully!')
      }
      setShowForm(false)
    } catch {
      toast.error('Failed to save entry')
    }
  }

  const formatFullDate = (dateStr: string): string => {
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-rose-100">
        <Heart className="h-16 w-16 text-rose-500 animate-pulse-slow-fade mx-auto" />
        <p className="text-pink-800 text-lg ml-4">Cargando tu diario de amor...</p>
      </div>
    )
  }

  if (showPartnerLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 p-4 custom-scrollbar">
        <div className="container mx-auto max-w-4xl bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-pink-100 animate-fade-in">
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

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 p-4 custom-scrollbar">
        <div className="container mx-auto max-w-4xl bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-pink-100 animate-fade-in">
          <Button
            variant="outline"
            onClick={handleCancelForm}
            className="mb-6 px-6 py-3 rounded-xl shadow-md border-pink-200 text-pink-700 hover:bg-pink-50 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            ← Volver al Diario
          </Button>
          <DiaryForm
            entry={editingEntry || undefined}
            onSave={handleSaveEntry}
            onCancel={handleCancelForm}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 overflow-hidden custom-scrollbar">
      <LoveNoteModal />

      <Header
        onNewEntry={handleNewEntry}
        onShowPartnerLink={() => setShowPartnerLink(true)}
      />
      <HeartParticles /> {/* Mantener esto para el fondo de partículas */}

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <Tabs defaultValue="diary" className="space-y-6">
          <TabsList className="grid grid-cols-2 bg-pink-50 rounded-2xl shadow-lg border border-pink-100 p-1">
            <TabsTrigger
              value="diary"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-xl transition-all duration-300 ease-in-out text-pink-700 font-semibold text-lg py-2 rounded-xl hover:text-rose-600 hover:scale-105"
            >
              <BookOpen className="h-5 w-5 mr-2" />Diary
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-xl transition-all duration-300 ease-in-out text-pink-700 font-semibold text-lg py-2 rounded-xl hover:text-rose-600 hover:scale-105"
            >
              <Heart className="h-5 w-5 mr-2" /> Games
            </TabsTrigger>
          </TabsList>

          {/* ───────────── DIARY TAB ───────────── */}
          <TabsContent value="diary" className="space-y-8 animate-fade-in">
            {/* Search & Filters */}
            <Card className="p-6 rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0 space-y-4">
                <SearchBar
                  onSearch={setSearchQuery}
                  placeholder="Busca en tus entradas del diario..."
                // className="w-full px-4 py-3 rounded-xl border-pink-200 focus:border-rose-300 focus:ring-1 focus:ring-rose-300 shadow-sm text-pink-800 placeholder-pink-300 transition-all duration-300"
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-pink-200 rounded-xl text-sm text-pink-800 bg-pink-50/50 shadow-sm focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition-all duration-300 cursor-pointer hover:bg-pink-100"
                  />
                  <select
                    value={filterMood}
                    onChange={e => setFilterMood(e.target.value)}
                    className="px-4 py-2 border border-pink-200 rounded-xl text-sm text-pink-800 bg-pink-50/50 shadow-sm focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition-all duration-300 cursor-pointer hover:bg-pink-100"
                  >
                    <option value="all" className="text-pink-800">Todos los Ánimos</option>
                    <option value="happy" className="text-pink-800">😊 Feliz</option>
                    <option value="sad" className="text-pink-800">😢 Triste</option>
                    <option value="excited" className="text-pink-800">🤩 Emocionado</option>
                    <option value="calm" className="text-pink-800">😌 Tranquilo</option>
                    <option value="stressed" className="text-pink-800">😰 Estresado</option>
                    <option value="grateful" className="text-pink-800">🙏 Agradecido</option>
                    <option value="neutral" className="text-pink-800">😐 Neutral</option>
                  </select>
                  {(searchQuery || selectedDate || filterMood !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedDate('')
                        setFilterMood('all')
                      }}
                      className="px-4 py-2 rounded-xl shadow-md border-pink-200 text-pink-700 hover:bg-pink-50 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entries List */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold flex items-center text-rose-500">
                <div className="bg-gradient-to-r from-pink-400 to-rose-500 p-3 rounded-full shadow-lg mr-3 transform transition-transform duration-300 hover:rotate-6">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                Diary Entries ({filteredEntries.length})
              </h2>

              {filteredEntries.length === 0 ? (
                <Card className="rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
                  <CardContent className="p-10 text-center">
                    <Heart className="h-16 w-16 text-pink-400 mx-auto mb-6 opacity-80 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-3 text-rose-500">No se encontraron entradas</h3>
                    <p className="text-pink-700 mb-6 text-lg">
                      {searchQuery || selectedDate || filterMood !== 'all'
                        ? 'Intenta ajustar tu búsqueda o filtros para encontrar tus recuerdos.'
                        : '¡Es hora de escribir la primera página de tu diario de amor!'
                      }
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
                Object.entries(
                  filteredEntries.reduce((groups, entry) => {
                    const date = entry.date
                    if (!groups[date]) groups[date] = []
                    groups[date].push(entry)
                    return groups
                  }, {} as Record<string, DiaryEntryType[]>)
                ).map(([date, entries]) => (
                  <div key={date} className="mb-8">
                    <div className='flex items-center justify-center '>
                      <h3 className="text-xl text-center font-bold mb-4 text-pink-700 bg-pink-50/60 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center shadow-md border border-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-lg justify-center">
                        <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                        {/* {new Date(date).toISOString().split('T')[0]} */}
                        {formatFullDate(date)}

                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
                      {entries.map(entry => (
                        <DiaryEntryComponent
                          key={entry.id}
                          entry={entry}
                          onEdit={handleEditEntry}
                        // onDelete={deleteEntry} // Asegúrate de pasar onDelete
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}

            </div>
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
      <style  >{`
        /* Para navegadores basados en WebKit (Chrome, Safari) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #ffe4e6, #fff0f5); /* from-pink-50 to-pink-100 */
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f472b6, #ec4899); /* from-pink-400 to-pink-500 */
          border-radius: 10px;
          border: 3px solid #ffe4e6; /* from-pink-50 */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ec4899, #db2777); /* from-pink-500 to-pink-600 */
        }

        /* Para Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f472b6 #ffe4e6; /* thumb color track color */
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
      `}</style>
    </div>
  )
}