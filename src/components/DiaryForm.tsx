// src/components/DiaryForm.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { DiaryEntry } from '@/types'
import { useAuth } from '@/contexts/AuthProvider'
import { PhotoCapture } from '@/components/PhotoCapture'
import { Calendar, Camera, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { SupabaseService } from '@/lib/SupabaseService'

interface DiaryFormProps {
  entry?: DiaryEntry
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel?: () => void
}

const moodOptions = [
  { value: 'happy', label: '😊 Happy' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'excited', label: '🤩 Excited' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'stressed', label: '😰 Stressed' },
  { value: 'grateful', label: '🙏 Grateful' },
  { value: 'neutral', label: '😐 Neutral' }
] as const

export const DiaryForm: React.FC<DiaryFormProps> = ({ entry, onSave, onCancel }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral' as DiaryEntry['mood'],
    isPrivate: false,
    date: new Date().toISOString().split('T')[0],
    photos: [] as string[]
  })
  const [uploading, setUploading] = useState(false)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)

  /* ───────── cargar entrada para edición ───────── */
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        isPrivate: entry.isPrivate,
        date: entry.date,
        photos: [...entry.photos]
      })
    }
  }, [entry])

  /* ───────── envío ───────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries')
      return
    }
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in both title and content')
      return
    }
    onSave({
      userId: user.id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      mood: formData.mood,
      isPrivate: formData.isPrivate,
      date: formData.date,
      photos: formData.photos
    })

    if (!entry) {
      setFormData({
        title: '',
        content: '',
        mood: 'neutral',
        isPrivate: false,
        date: new Date().toISOString().split('T')[0],
        photos: []
      })
    }
  }

  /* ───────── subir fotos desde disco ───────── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error('Log in to upload photos')
      return
    }
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const urls = await Promise.all(
        files.map(file => SupabaseService.uploadPhoto(file, user.id))
      )
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }))
    } catch (err) {
      toast.error('Photo upload failed')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  /* ────── foto desde cámara ────── */
  const handlePhotoCapture = async (publicUrl: string) => {
    setFormData(prev => ({ ...prev, photos: [...prev.photos, publicUrl] }))
  }

  const removePhoto = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx)
    }))
  }

  /* ────────── render ────────── */
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="h-5 w-5 mr-2 text-pink-500" />
          {entry ? 'Edit Entry' : 'New Diary Entry'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* fecha y mood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood">Mood</Label>
              <Select
                value={formData.mood}
                onValueChange={value => setFormData({ ...formData, mood: value as DiaryEntry['mood'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* título */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What happened today?"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* contenido */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Tell me about your day..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="resize-none"
              required
            />
          </div>

          {/* fotos */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="photos" className="flex items-center cursor-pointer">
                <Camera className="h-4 w-4 mr-2" /> Add Photos
              </Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photos')?.click()} disabled={uploading}>
                <Camera className="h-4 w-4 mr-2" /> Upload
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPhotoCapture(true)}>
                <Camera className="h-4 w-4 mr-2" /> Take Photo
              </Button>
            </div>
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo} alt={`Upload ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* privado */}
          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.isPrivate}
              onCheckedChange={checked => setFormData({ ...formData, isPrivate: checked })}
            />
            <Label htmlFor="private" className="text-sm">
              Keep this entry private (only you can see it)
            </Label>
          </div>

          {/* acciones */}
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1" disabled={uploading}>
              {entry ? 'Update Entry' : 'Save Entry'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* modal de cámara */}
        <PhotoCapture
          userId={user?.id || ''}
          isOpen={showPhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
          onPhotoCapture={handlePhotoCapture}
        />
      </CardContent>
    </Card>
  )
}
