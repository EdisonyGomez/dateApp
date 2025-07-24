import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  fallbackColor?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  fallbackColor = 'bg-blue-100 text-blue-700'
}) => {
  const initial = name?.charAt(0).toUpperCase() ?? 'U'
  const sizeClass = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }[size]

  return (
    <Avatar className={sizeClass}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="rounded-full object-cover" />
      ) : (
        <AvatarFallback className={fallbackColor}>
          {initial}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
