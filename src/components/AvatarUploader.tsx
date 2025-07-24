import React, { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'

export const AvatarUploader = () => {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !user) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) {
      console.error(uploadError)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    // Guarda en perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error(updateError)
    } else {
      setAvatarUrl(publicUrl)
    }

    setUploading(false)
  }

  return (
    <div className="flex flex-col items-start space-y-2">
      <input type="file" ref={fileRef} accept="image/*" />
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Avatar'}
      </Button>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-24 h-24 rounded-full border object-cover"
        />
      )}
    </div>
  )
}
