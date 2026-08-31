import type React from "react"
import { Sun, Moon, Sparkles } from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"
import { CategoryGlyph } from "./CategoryBadge"
import type { Occurrence } from "@/lib/calendar/recurrence"

/**
 * ───────────────────────────────────────────────
 *  CalendarHeader — identidad de la pareja + Today/Tonight
 * ───────────────────────────────────────────────
 *  Banda superior del calendario. Da sentido de "espacio de dos":
 *   - Dos orbs (avatares) fusionados.
 *   - Resumen "Today" (cuántos planes) y "Tonight" (primer plan nocturno).
 *  Presentacional puro: no toca datos ni lógica.
 */

interface CalendarHeaderProps {
  me: { name: string; avatarUrl?: string | null }
  partner: { name: string } | null
  /** ocurrencias de HOY (ya filtradas por el contenedor) */
  todayOccs: Occurrence[]
}

/** Primer plan "de noche": con hora, no todo-el-día, a partir de las 18:00. */
const findTonight = (occs: Occurrence[]): Occurrence | null =>
  occs.find((o) => !o.plan.all_day && !!o.plan.time && o.plan.time >= "18:00") ?? null

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ me, partner, todayOccs }) => {
  const coupleName = partner ? `${me.name} & ${partner.name}` : me.name
  const count = todayOccs.length
  const tonight = findTonight(todayOccs)

  const todayLabel =
    count === 0 ? "Nothing scheduled" : `${count} plan${count !== 1 ? "s" : ""}`

  return (
    <div className="cal-glass flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      {/* identidad */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <UserAvatar name={me.name} avatarUrl={me.avatarUrl ?? undefined} size="md" fallbackColor="bg-rose-500" />
          {partner && (
            <div className="-ml-3">
              <UserAvatar name={partner.name} size="md" fallbackColor="bg-violet-500" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-rose-400">
            <Sparkles className="h-3 w-3" />
            Our calendar
          </div>
          <div className="truncate text-lg font-bold text-gray-800">{coupleName}</div>
        </div>
      </div>

      {/* Today / Tonight */}
      <div className="flex flex-col gap-1.5 sm:items-end">
        <div className="flex items-center gap-2 text-sm">
          <Sun className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="font-semibold text-gray-700">Today</span>
          <span className="text-gray-500">{todayLabel}</span>
        </div>
        {tonight ? (
          <div className="flex items-center gap-2 text-sm">
            <Moon className="h-4 w-4 shrink-0 text-violet-500" />
            <span className="font-semibold text-gray-700">Tonight</span>
            <span className="flex items-center gap-1 truncate text-gray-500">
              <CategoryGlyph category={tonight.plan.category} className="h-3.5 w-3.5" />
              <span className="truncate">{tonight.plan.title}</span>
              <span className="tabular-nums text-gray-400">· {tonight.plan.time}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Moon className="h-4 w-4 shrink-0" />
            <span>A quiet night for two 💫</span>
          </div>
        )}
      </div>
    </div>
  )
}
