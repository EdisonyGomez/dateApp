// src/components/PhotoCapture.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { SupabaseService } from '@/lib/SupabaseService'

interface PhotoCaptureProps {
  userId: string
  onPhotoCapture: (photoUrl: string) => void
  isOpen: boolean
  onClose: () => void
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  userId,
  onPhotoCapture,
  isOpen,
  onClose
}) => {
  /* ─────────────────── refs ─────────────────── */
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ────────────────── state ─────────────────── */
  const [isStreaming, setIsStreaming] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  /* ────────────────── cámara ─────────────────── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Esperar a que el video esté listo
        const onLoadedMetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
            setIsStreaming(true)
          }
        }

        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata)
        
        // Cleanup del event listener
        return () => {
          videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !isStreaming) {
      toast.error('La cámara no está lista.')
      return
    }

    // Verificar que el video tenga dimensiones
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('La cámara aún está cargando. Espera un momento.')
      return
    }

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Error accediendo al canvas.')
      return
    }

    // Dibujar el frame actual del video en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a blob y crear preview
    canvas.toBlob(blob => {
      if (!blob) {
        toast.error('No se pudo capturar la imagen.')
        return
      }

      const file = new File([blob], `photo-${Date.now()}.jpeg`, {
        type: 'image/jpeg'
      })
      
      setCapturedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      stopCamera()
      
      console.log('Photo captured successfully:', file.name, file.size)
    }, 'image/jpeg', 0.9)
  }, [isStreaming, stopCamera])

  /* ──────────────── upload desde disco ─────────────── */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    
    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /* ───────────── confirmación (subida) ─────────────── */
  const confirmPhoto = useCallback(async () => {
    if (!capturedFile) {
      toast.error('No photo to upload')
      return
    }
    
    setIsUploading(true)
    try {
      const publicUrl = await SupabaseService.uploadPhoto(capturedFile, userId)
      onPhotoCapture(publicUrl)
      toast.success('Photo added successfully!')
      resetState()
      onClose()
    } catch (err) {
      toast.error('Upload failed')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }, [capturedFile, userId, onPhotoCapture, onClose])

  /* ─────────────── utilidades ─────────────── */
  const retakePhoto = useCallback(() => {
    resetState()
    startCamera()
  }, [startCamera])

  const resetState = useCallback(() => {
    setCapturedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setIsUploading(false)
    stopCamera()
  }, [previewUrl, stopCamera])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  /* ─────────────── Effects ─────────────── */
  // Iniciar cámara cuando se abre el modal
  useEffect(() => {
    if (isOpen && !previewUrl) {
      startCamera()
    }
    
    // Cleanup cuando se cierra
    return () => {
      if (!isOpen) {
        stopCamera()
      }
    }
  }, [isOpen]) // Solo depende de isOpen

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      stopCamera()
    }
  }, [])

  /* ────────────────── render ────────────────── */
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Capture Today's Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ─────────────── vista inicial ─────────────── */}
          {!previewUrl ? (
            <>
              {isStreaming ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg bg-black"
                    autoPlay
                    playsInline
                    muted
                    style={{ maxHeight: '400px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex justify-center mt-4 space-x-2">
                    <Button 
                      onClick={capturePhoto} 
                      size="lg"
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Take a photo or upload from your device
                    </p>
                    <div className="space-y-2">
                      <Button onClick={startCamera} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ─────────── pre-visualización ─────────── */
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg max-h-96 object-cover"
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={confirmPhoto} 
                  className="flex-1"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Use This Photo'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={retakePhoto}
                  disabled={isUploading}
                >
                  Retake
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}