import React, { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'

export const AvatarUploader = () => {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Cargar avatar existente al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadExistingAvatar()
    }
  }, [user?.id])

  const loadExistingAvatar = async () => {
    if (!user?.id) return

    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (data?.avatar_url && !error) {
      setAvatarUrl(data.avatar_url)
    }
  }

  // Función para extraer el nombre del archivo desde la URL de Supabase
  const getFileNameFromUrl = (url: string): string | null => {
    try {
      // Ejemplo de URL de Supabase:
      // https://project.supabase.co/storage/v1/object/public/avatars/filename.jpg
      
      // Remover parámetros de query (?v=timestamp)
      const cleanUrl = url.split('?')[0]
      
      // Buscar la parte después de '/avatars/'
      const avatarsIndex = cleanUrl.indexOf('/avatars/')
      if (avatarsIndex === -1) {
        console.error('URL no contiene /avatars/', url)
        return null
      }
      
      // Extraer solo el nombre del archivo
      const fileName = cleanUrl.substring(avatarsIndex + '/avatars/'.length)
      console.log('Extracted filename:', fileName)
      return fileName
    } catch (error) {
      console.error('Error extracting filename from URL:', error)
      return null
    }
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !user) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Eliminar avatar anterior si existe
    if (avatarUrl) {
      const oldFileName = getFileNameFromUrl(avatarUrl)
      if (oldFileName) {
        console.log('Attempting to delete old file:', oldFileName)
        
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([oldFileName])
        
        if (deleteError) {
          console.error('Error deleting old avatar:', deleteError)
          // Continuar con la subida aunque no se pueda eliminar el anterior
        } else {
          console.log('Old avatar deleted successfully')
        }
      }
    }

    // Subir nuevo avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading:', uploadError)
      setUploading(false)
      return
    }

    console.log('New avatar uploaded successfully:', filePath)

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
    } else {
      setAvatarUrl(publicUrl)
      // Limpiar el input file
      if (fileRef.current) {
        fileRef.current.value = ''
      }
      console.log('Profile updated with new avatar URL')
    }

    setUploading(false)
  }

  // Función alternativa: Listar y eliminar todos los avatares del usuario
  const deleteAllUserAvatars = async () => {
    if (!user?.id) return

    try {
      // Listar todos los archivos del usuario
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list('', {
          search: user.id  // Buscar archivos que contengan el ID del usuario
        })

      if (listError) {
        console.error('Error listing files:', listError)
        return
      }

      if (files && files.length > 0) {
        const filesToDelete = files
          .filter(file => file.name.startsWith(user.id))
          .map(file => file.name)

        if (filesToDelete.length > 0) {
          console.log('Files to delete:', filesToDelete)
          
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove(filesToDelete)

          if (deleteError) {
            console.error('Error deleting files:', deleteError)
          } else {
            console.log('All user avatars deleted successfully')
          }
        }
      }
    } catch (error) {
      console.error('Error in deleteAllUserAvatars:', error)
    }
  }

  // Versión alternativa del handleUpload que usa deleteAllUserAvatars
  const handleUploadAlternative = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !user) return

    setUploading(true)

    // Eliminar todos los avatares anteriores del usuario
    await deleteAllUserAvatars()

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Subir nuevo avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading:', uploadError)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
    } else {
      setAvatarUrl(publicUrl)
      if (fileRef.current) {
        fileRef.current.value = ''
      }
    }

    setUploading(false)
  }

  // Función para forzar recarga de imagen (romper cache)
  const getImageUrl = (url: string) => {
    return `${url}?v=${Date.now()}`
  }

  return (
    <div className="flex flex-col items-start space-y-4">
      {avatarUrl && (
        <div className="relative">
          <img
            src={getImageUrl(avatarUrl)}
            alt="Avatar"
            className="w-24 h-24 rounded-full border object-cover"
            onError={() => {
              console.log('Error loading image, reloading...')
              loadExistingAvatar()
            }}
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input 
          type="file" 
          ref={fileRef} 
          accept="image/*" 
          className="text-sm"
        />
        <Button onClick={handleUpload} disabled={uploading || !user}>
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </Button>
        {/* Botón para probar el método alternativo */}
        <Button 
          onClick={handleUploadAlternative} 
          disabled={uploading || !user}
          variant="outline"
          className="text-xs"
        >
          {uploading ? 'Uploading...' : 'Upload (Alt)'}
        </Button>
      </div>
    </div>
  )
}