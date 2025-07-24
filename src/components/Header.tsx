// src/components/Header.tsx
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Heart, LogOut, PlusCircle, User, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onNewEntry: () => void
  onShowPartnerLink: () => void
}

export const Header: React.FC<HeaderProps> = ({ onNewEntry, onShowPartnerLink }) => {
  const { user, loading, signOut, partner, profile } = useAuth()
  const [partnerName, setPartnerName] = useState<string | null>(null)

  const navigate = useNavigate()

  /* ──────── traer nombre de pareja ──────── */
  useEffect(() => {
    const fetchPartner = async () => {
      if (!user) {
        setPartnerName(null)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()
      if (!profile?.partner_id) {
        setPartnerName(null)
        return
      }
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', profile.partner_id)
        .single()
      setPartnerName(partnerProfile?.name ?? 'Partner')
    }

    fetchPartner()
  }, [user])

  if (loading) return null // o un spinner, pero evitamos parpadeo

  /* ──────── helpers ──────── */
  const userName = (user?.user_metadata?.name as string) || user?.email || ''
  const initial = userName.charAt(0).toUpperCase()

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* logo + título */}
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                M.Y. Diary
              </h1>

              {partnerName && (
                <p className="text-xs text-muted-foreground">Connected with {partnerName}</p>
              )}
            </div>
          </div>

          {/* acciones */}
          <div className="flex items-center space-x-3">
            <Button onClick={onNewEntry} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Entry
            </Button>

            {!partnerName && (
              <Button variant="outline" size="sm" onClick={onShowPartnerLink}>
                <Users className="h-4 w-4 mr-2" />
                Link Partner
              </Button>
            )}

            {/* menú usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">

                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-700">{initial}</AvatarFallback>
                    )}
                  </Avatar>

                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium truncate max-w-[120px]">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* ✅ NUEVO ITEM: Ir al perfil */}
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Editar perfil</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
