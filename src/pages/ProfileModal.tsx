"use client"
import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { UserAvatar } from "@/components/UserAvatar"
import { ProfileExperience } from "@/components/profile/ProfileExperience"

interface ProfileModalProps {
  userId: string
  fallbackColor?: string
  isCurrentUser?: boolean
  initialProfile?: { name?: string; avatar_url?: string | null }
}

/**
 * Avatar que abre la experiencia de perfil temática (ver + editar inline).
 * Toda la vista/edición vive en <ProfileExperience/>.
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, fallbackColor, isCurrentUser = false, initialProfile }) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className="inline-flex cursor-pointer rounded-full transition-all duration-300 hover:scale-110 hover:rotate-2">
          <UserAvatar
            name={initialProfile?.name || "Usuario"}
            avatarUrl={initialProfile?.avatar_url || undefined}
            size="xl"
            fallbackColor={fallbackColor}
          />
        </span>
      </DialogTrigger>

      <DialogContent className="h-[92vh] w-[1100px] max-w-[96vw] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de {initialProfile?.name || "pareja"}</DialogTitle>
          <DialogDescription>Perfil temático: información, gustos e historia.</DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <button className="absolute right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50">
            <X className="h-5 w-5" />
          </button>
        </DialogClose>

        <div className="custom-scrollbar h-full overflow-y-auto">
          {open && <ProfileExperience userId={userId} isCurrentUser={isCurrentUser} initialProfile={initialProfile} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
