// src/components/PartnerLinkForm.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { SupabaseService } from '@/lib/SupabaseService'
import { toast } from 'sonner'
import { Heart, Users } from 'lucide-react'

export const PartnerLinkForm: React.FC = () => {
  const { user } = useAuth()
  const [partnerEmail, setPartnerEmail] = useState('')
  const [loading, setLoading] = useState(false)

  /* ───────────── link partner ───────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be logged in')
      return
    }
    if (!partnerEmail.trim()) {
      toast.error("Please enter your partner's email")
      return
    }
    if (partnerEmail === user.email) {
      toast.error('You cannot link to yourself')
      return
    }

    setLoading(true)

    try {
      // busca partner por email
      const { data: partnerProfile, error } = await supabase
        .from('profiles')
        .select('id, partner_id')
        .eq('email', partnerEmail.trim())
        .maybeSingle();           // ← no lanza PGRST116
      if (error || !partnerProfile) {
        toast.error('Partner not found. They must register first.')
        return
      }
      if (partnerProfile.partner_id && partnerProfile.partner_id !== user.id) {
        toast.error('This user is already linked to someone else')
        return
      }

      // establece el vínculo en ambas direcciones
      await SupabaseService.linkPartners(user.id, partnerProfile.id)
      await SupabaseService.linkPartners(partnerProfile.id, user.id)

      toast.success('Partner linked successfully! 💕')
      setPartnerEmail('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to link partner')
    } finally {
      setLoading(false)
    }
  }

  /* ───────────── UI ───────────── */
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-pink-100 rounded-full">
            <Users className="h-6 w-6 text-pink-600" />
          </div>
        </div>
        <CardTitle className="text-xl">Link Your Partner</CardTitle>
        <CardDescription>Connect with your partner to start sharing diary entries</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partner-email">Partner's Email</Label>
            <Input
              id="partner-email"
              type="email"
              placeholder="partner@email.com"
              value={partnerEmail}
              onChange={e => setPartnerEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Your partner must already have an account</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Heart className="h-4 w-4 mr-2" />
            {loading ? 'Linking...' : 'Link Partner'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
