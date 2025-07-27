import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  name: string
  avatarUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  fallbackColor?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = "md",
  fallbackColor = "bg-blue-500",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Avatar className={`${sizeClasses[size]} ring-2 ring-white shadow-lg`}>
      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name} />
      <AvatarFallback className={`${fallbackColor} text-white font-semibold`}>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
