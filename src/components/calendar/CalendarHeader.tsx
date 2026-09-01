import type React from "react"
import { Sparkles } from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"

/**
 * ───────────────────────────────────────────────
 *  CalendarHeader — identidad de la pareja
 * ───────────────────────────────────────────────
 *  Dos orbs (avatares) fusionados + nombre de la pareja.
 *  Presentacional puro. (El "Today/Tonight" se sacó: era redundante
 *  con la sección "Upcoming" del pie del calendario.)
 */

interface CalendarHeaderProps {
  me: { name: string; avatarUrl?: string | null }
  partner: { name: string } | null
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ me, partner }) => {
  const coupleName = partner ? `${me.name} & ${partner.name}` : me.name

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex items-center">
        <UserAvatar name={me.name} avatarUrl={me.avatarUrl ?? undefined} size="md" fallbackColor="bg-rose-500" />
        {partner && (
          <div className="-ml-3">
            <UserAvatar name={partner.name} size="md" fallbackColor="bg-violet-500" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-rose-400">
          <Sparkles className="h-3 w-3" />
          Our calendar
        </div>
        <div className="font-quick truncate text-lg font-bold text-gray-800">{coupleName}</div>
      </div>
    </div>
  )
}
