import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useDiaryEntries } from '@/hooks/useDiaryEntries'
import { Header } from '@/components/Header'
import { DiaryForm } from '@/components/DiaryForm'
import { DiaryEntry } from '@/components/DiaryEntry'
import { PartnerLinkForm } from '@/components/PartnerLinkForm'
import { SearchBar } from '@/components/SearchBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DiaryEntry as DiaryEntryType } from '@/types'
import { toast } from 'sonner'
import { Calendar, Heart, BookOpen } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user, loading } = useAuth()
  const {
    entries,
    loading: entriesLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate
  } = useDiaryEntries()

  /* ─────── partner profile ─────── */
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null)
  useEffect(() => {
    const fetchPartner = async () => {
      if (!user) {
        setPartner(null)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .maybeSingle() // ← puede no haber fila

      if (!profile?.partner_id) {
        setPartner(null)
        return
      }
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', profile.partner_id)
        .maybeSingle()

      setPartner(partnerProfile ?? null)
    }
    fetchPartner()
  }, [user])

  /* ─────── UI states ─────── */
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntryType | null>(null)
  const [showPartnerLink, setShowPartnerLink] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [filterMood, setFilterMood] = useState('all')

  /* ─────── filters memo ─────── */
  const filteredEntries = useMemo(() => {
    let filtered = entries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        e => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      )
    }
    if (selectedDate) filtered = filtered.filter(e => e.date === selectedDate)
    if (filterMood !== 'all') filtered = filtered.filter(e => e.mood === filterMood)
    return filtered
  }, [entries, searchQuery, selectedDate, filterMood])

  /* ─────── today entries ─────── */
  const todayISO = new Date().toISOString().split('T')[0]
  const todayEntry = getEntryByDate(todayISO)
  const partnerTodayEntry = partner ? getEntryByDate(todayISO, partner.id) : null

  /* ─────── CRUD handlers ─────── */
  const handleSaveEntry = (data: Omit<DiaryEntryType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        updateEntry(editingEntry.id, data)
        toast.success('Entry updated successfully!')
      } else {
        addEntry(data)
        toast.success('Entry saved successfully!')
      }
      setShowForm(false)
      setEditingEntry(null)
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

  /* ─────── loading states ─────── */
  if (loading || entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-pink-500 animate-pulse mx-auto mb-2" />
          <p>Loading your diary...</p>
        </div>
      </div>
    )
  }

  /* ─────── partner link screen ─────── */
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

  /* ─────── form screen ─────── */
  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button variant="outline" onClick={handleCancelForm} className="mb-4">
              ← Back to Diary
            </Button>
          </div>
          <DiaryForm entry={editingEntry || undefined} onSave={handleSaveEntry} onCancel={handleCancelForm} />
        </div>
      </div>
    )
  }

  /* ─────── main dashboard ─────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Header onNewEntry={handleNewEntry} onShowPartnerLink={() => setShowPartnerLink(true)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Today's Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-pink-500" /> Today's Moments
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* my entry */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-blue-500" /> Your Entry
                </h3>
                {todayEntry ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{todayEntry.title}</p>
                    <p className="text-xs text-muted-foreground">{todayEntry.content.substring(0, 100)}...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">No entry for today yet</p>
                    <Button size="sm" onClick={handleNewEntry}>
                      Write Today's Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* partner entry */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-pink-500" />
                  {partner ? `${partner.name}'s Entry` : "Partner's Entry"}
                </h3>
                {!partner ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">No partner linked yet</p>
                    <Button size="sm" variant="outline" onClick={() => setShowPartnerLink(true)}>
                      Link Partner
                    </Button>
                  </div>
                ) : partnerTodayEntry ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{partnerTodayEntry.title}</p>
                    <p className="text-xs text-muted-foreground">{partnerTodayEntry.content.substring(0, 100)}...</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{partner.name} hasn't written today yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <SearchBar onSearch={setSearchQuery} placeholder="Search diary entries..." />
          <div className="flex flex-wrap gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-md text-sm" />
            <select value={filterMood} onChange={e => setFilterMood(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
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
            <BookOpen className="h-6 w-6 mr-2 text-purple-500" /> Diary Entries ({filteredEntries.length})
          </h2>
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedDate || filterMood !== 'all' ? 'Try adjusting your search or filters' : 'Start writing your first diary entry!'}
                </p>
                <Button onClick={handleNewEntry}>Write Your First Entry</Button>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map(e => <DiaryEntry key={e.id} entry={e} onEdit={handleEditEntry} />)
          )}
        </div>
      </div>
    </div>
  )
}
