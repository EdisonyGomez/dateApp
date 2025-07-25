import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
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
    xs: 'h-5 w-5',     // 1.25rem
    sm: 'h-6 w-6',     // 1.5rem
    md: 'h-8 w-8',     // 2rem
    lg: 'h-12 w-12',   // 3rem
    xl: 'h-16 w-16',   // 4rem
    '2xl': 'h-20 w-20', // 5rem
    '4xl': 'h-24 w-24'  // 6rem
  }[size]

  return (
<Avatar className={sizeClass} style={size === '4xl' ? { height: '8.75rem', width: '8.75rem' } : {}}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="rounded-full object-cover w-full h-full" />
      ) : (
        <AvatarFallback className={fallbackColor}>
          {initial}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
