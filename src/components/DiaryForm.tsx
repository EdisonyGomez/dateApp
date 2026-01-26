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
import { HandwritingPad } from './HandwritingPad'

interface DiaryFormProps {
  entry?: DiaryEntry
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel?: () => void
}
const moodOptions = [
  // 🎯 Estados base
  { value: 'happy', label: '😊 Happy' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'excited', label: '🤩 Excited' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'stressed', label: '😰 Stressed' },
  { value: 'grateful', label: '🙏 Grateful' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'cansado', label: '😴 Cansado' },
  { value: 'enamorado', label: '😍 Enamorado' },
  { value: 'aburrido', label: '😒 Aburrido' },
  { value: 'sorprendido', label: '😲 Sorprendido' },
  { value: 'confundido', label: '😕 Confundido' },
  { value: 'ansioso', label: '😟 Ansioso' },
  { value: 'relajado', label: '😌 Relajado' },
  { value: 'nostálgico', label: '😢 Nostálgico' },
  { value: 'motivado', label: '💪 Motivado' },
  { value: 'inspirado', label: '✨ Inspirado' },
  { value: 'frustrado', label: '😤 Frustrado' },
  { value: 'aliviado', label: '😌 Aliviado' },
  { value: 'worried', label: '😟 Worried' },
  { value: 'scared', label: '😨 Scared' },
  { value: 'hopeful', label: '🌟 Hopeful' },
  { value: 'mad', label: '😠 Mad' },
  { value: 'horny', label: '🔥 Horny' },
  { value: 'meh', label: '😑 Meh' },
  { value: 'sleepy', label: '😴 Sleepy' },
  { value: 'sick', label: '🤒 Sick' },
  { value: 'jealous', label: '😒 Jealous' },
  { value: 'proud', label: '😎 Proud' },

  // ❤️ Románticos / Tiernos
  { value: 'apasionado', label: '💘 Apasionado' },
  { value: 'cariñoso', label: '🤗 Cariñoso' },
  { value: 'meloso', label: '🍯 Meloso' },
  { value: 'tierno', label: '🐻 Tierno' },
  { value: 'coqueto', label: '😉 Coqueto' },

  // ⚡ Energía positiva
  { value: 'energico', label: '⚡ Enérgico' },
  { value: 'feliz2', label: '😄 Muy feliz' },
  { value: 'agradecido2', label: '💝 Agradecido' },
  { value: 'bendecido', label: '🕊️ Bendecido' },
  { value: 'optimista', label: '🌈 Optimista' },

  // 🌧️ Emocionales / Melancólicos
  { value: 'melancolico', label: '🌧️ Melancólico' },
  { value: 'vulnerable', label: '🥺 Vulnerable' },
  { value: 'sensible', label: '💧 Sensible' },
  { value: 'dolido', label: '💔 Dolido' },
  { value: 'agotado_emocionalmente', label: '🥀 Agotado emocionalmente' },

  // 😡 Intensos / Catarsis
  { value: 'estresado2', label: '🔥 Muy estresado' },
  { value: 'agotado', label: '😮‍💨 Agotado' },
  { value: 'irritado', label: '😤 Irritado' },
  { value: 'explosivo', label: '💥 Explosivo' },
  { value: 'sobrepensando', label: '🧠 Sobrepensando' },

  // 🔥 Picantes / Traviesos
  { value: 'spicy', label: '🌶️ Spicy' },
  { value: 'travieso', label: '😏 Travieso' },
  { value: 'seductor', label: '😈 Seductor' },
  { value: 'fogoso', label: '🔥🔥 Fogoso' },
  { value: 'atrevido', label: '💋 Atrevido' },

  // 💭 Profundos / Reflexivos
  { value: 'reflexivo', label: '🧘‍♂️ Reflexivo' },
  { value: 'introspectivo', label: '🌀 Introspectivo' },
  { value: 'pensativo', label: '🤔 Pensativo' },
  { value: 'soñador', label: '💭 Soñador' },
  { value: 'creativo', label: '🎨 Creativo' }
] as const



// 1) Añade este helper arriba del componente:
const getLocalDateISO = () => {
  const now = new Date()
  // Ajuste inverso del offset para quedarnos con fecha local
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}

export const DiaryForm: React.FC<DiaryFormProps> = ({ entry, onSave, onCancel }) => {
  const { user } = useAuth()

  const [inputMode, setInputMode] = useState<'text' | 'hand'>('text')
  const [handwritingImage, setHandwritingImage] = useState<string>('')


  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral' as DiaryEntry['mood'],
    isPrivate: false,
    date: getLocalDateISO(),   // ← antes: new Date().toISOString().split('T')[0]
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

  /* ───────── validar contenido ───────── */
  const hasValidContent =
    inputMode === 'text'
      ? formData.content.trim().length > 0
      : handwritingImage.length > 0

  /* ───────── envío ───────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries')
      return
    }
    if (!formData.title.trim()) {
      toast.error('Please fill in the title')
      return
    }

    if (!hasValidContent) {
      toast.error(
        inputMode === 'text'
          ? 'Please write some content'
          : 'Please write something with the pen'
      )
      return
    }

    onSave({
      userId: user.id,
      title: formData.title.trim(),
      content:
        inputMode === 'text'
          ? formData.content.trim()
          : '[HANDWRITING]',
      mood: formData.mood,
      isPrivate: formData.isPrivate,
      date: formData.date,
      photos:
        inputMode === 'hand' && handwritingImage
          ? [...formData.photos, handwritingImage]
          : formData.photos
    })


    if (!entry) {
      setFormData({
        title: '',
        content: '',
        mood: 'neutral',
        isPrivate: false,
        date: getLocalDateISO(),
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

      <div className="flex gap-2">
        <Button
          type="button"
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={() => setInputMode('text')}
        >
          ⌨️ Texto
        </Button>
        <Button
          type="button"
          variant={inputMode === 'hand' ? 'default' : 'outline'}
          onClick={() => setInputMode('hand')}
        >
          ✍️ Escritura
        </Button>
      </div>

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
            <Label>Content</Label>

            {inputMode === 'text' ? (
              <Textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
            ) : (
              <>
                <HandwritingPad onChange={setHandwritingImage} />
                {handwritingImage && (
                  <p className="text-xs text-muted-foreground">
                    Escritura manual capturada ✔
                  </p>
                )}
              </>
            )}
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
