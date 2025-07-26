//src/pages/Dashboard.tsx
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
      filtered = filtered.filter(e => e.date === selectedDate)
    }
    if (filterMood !== 'all') {
      filtered = filtered.filter(e => e.mood === filterMood)
    }
    return filtered
  }, [entries, searchQuery, selectedDate, filterMood])

  const today = new Date().toISOString().split('T')[0]
  const todayEntry = getEntryByDate(today)
  const partnerTodayEntry = partner
    ? getEntryByDate(today, partner.id)
    : null

  const handleSaveEntry = (data: Omit<DiaryEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="h-8 w-8 text-pink-500 animate-pulse mx-auto mb-2" />
        <p>Loading your diary...</p>
      </div>
    )
  }

  if (showPartnerLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Link Your Partner</h1>
            <Button variant="outline" onClick={() => setShowPartnerLink(false)}>
              Back to Diary
            </Button>
          </div>
          <PartnerLinkForm />
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <Button variant="outline" onClick={handleCancelForm} className="mb-4">
            ← Back to Diary
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
  <div className="relative min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
        <LoveNoteModal />

      <Header
        onNewEntry={handleNewEntry}
        onShowPartnerLink={() => setShowPartnerLink(true)}
      />
    <HeartParticles />

      <div className="container mx-auto px-4 py-6 max-w-4xl relative z-0">
        <Tabs defaultValue="diary" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="diary">Diary</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
          </TabsList>

          {/* ───────────── DIARY TAB ───────────── */}
          <TabsContent value="diary" className="space-y-8">
    

            {/* Search & Filters */}
            <div className="space-y-4">
              <SearchBar onSearch={setSearchQuery} placeholder="Search diary entries..." />
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <select
                  value={filterMood}
                  onChange={e => setFilterMood(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Moods</option>
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="calm">😌 Calm</option>
                  <option value="stressed">😰 Stressed</option>
                  <option value="grateful">🙏 Grateful</option>
                  <option value="neutral">😐 Neutral</option>
                </select>
                {(searchQuery || selectedDate || filterMood !== 'all') && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('')
                    setSelectedDate('')
                    setFilterMood('all')
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Entries List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-purple-500" />
                Diary Entries ({filteredEntries.length})
              </h2>
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedDate || filterMood !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Start writing your first diary entry!'
                      }
                    </p>
                    <Button onClick={handleNewEntry}>
                      Write Your First Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map(entry => (
                  <DiaryEntryComponent
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditEntry}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* ───────────── GAMES TAB ───────────── */}
          <TabsContent value="games">
            <CoupleGames />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
