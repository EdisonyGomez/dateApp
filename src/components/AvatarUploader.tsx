"use client"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Camera, Loader2, User, X, Heart, Sparkles } from "lucide-react"

interface AvatarUploaderProps {
  onAvatarUpdate?: (url: string) => void
  size?: "sm" | "md" | "lg" | "xl"
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ onAvatarUpdate, size = "lg" }) => {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  }

  useEffect(() => {
    if (user?.id) {
      loadExistingAvatar()
    }
  }, [user?.id])

  const loadExistingAvatar = async () => {
    if (!user?.id) return

    const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

    if (data?.avatar_url && !error) {
      setAvatarUrl(data.avatar_url)
    }
  }

  const deleteOldAvatar = async (url: string) => {
    try {
      const cleanUrl = url.split("?")[0]
      const avatarsIndex = cleanUrl.indexOf("/avatars/")

      if (avatarsIndex === -1) return

      const fileName = cleanUrl.substring(avatarsIndex + "/avatars/".length)

      const { error } = await supabase.storage.from("avatars").remove([fileName])

      if (error) {
        console.error("Error deleting old avatar:", error)
      }
    } catch (error) {
      console.error("Error in deleteOldAvatar:", error)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB")
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if (!user) {
      toast.error("Debes estar autenticado")
      return
    }

    setUploading(true)

    try {
      // Eliminar avatar anterior si existe
      if (avatarUrl) {
        await deleteOldAvatar(avatarUrl)
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const publicUrl = data.publicUrl

      // Actualizar en la base de datos
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      setPreviewUrl(null)
      onAvatarUpdate?.(publicUrl)

      toast.success("¡Foto de perfil actualizada!")

      // Limpiar input
      if (fileRef.current) {
        fileRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Error al subir la imagen")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileRef.current?.click()
  }

  const currentImageUrl = previewUrl || avatarUrl

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Avatar Display */}
      <div className="relative group">
        <div
          className={`
            ${sizeClasses[size]} 
            rounded-full 
            border-4 
            border-pink-200 
            shadow-2xl 
            overflow-hidden 
            bg-gradient-to-br 
            from-pink-100 
            to-rose-100 
            transition-all 
            duration-500 
            group-hover:scale-105 
            group-hover:shadow-pink-300/50
            ${dragOver ? "border-pink-400 scale-105" : ""}
            ${uploading ? "animate-pulse" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {currentImageUrl ? (
            <img
              src={`${currentImageUrl}?v=${Date.now()}`}
              alt="Avatar"
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-1/2 h-1/2 text-pink-400" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <Heart className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
        <Sparkles className="absolute -bottom-1 -left-1 w-5 h-5 text-rose-400 animate-pulse" />
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative 
          border-2 
          border-dashed 
          rounded-2xl 
          p-6 
          transition-all 
          duration-300 
          cursor-pointer
          hover:bg-pink-50
          ${dragOver ? "border-pink-400 bg-pink-50 scale-105" : "border-pink-200 hover:border-pink-300"}
          ${uploading ? "pointer-events-none opacity-50" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-700">
              {dragOver ? "¡Suelta tu imagen aquí!" : "Sube tu foto de perfil"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Arrastra una imagen o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-2">PNG, JPG hasta 5MB</p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          className="hidden"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleClick}
          disabled={uploading}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Cambiar Foto
            </>
          )}
        </Button>

        {currentImageUrl && !uploading && (
          <Button
            variant="outline"
            onClick={() => {
              setPreviewUrl(null)
              if (fileRef.current) fileRef.current.value = ""
            }}
            className="border-pink-300 text-pink-700 hover:bg-pink-50 rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
