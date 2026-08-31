import type React from "react"
import { Calendar, Clock, MapPin, Bell, ListTodo, Repeat } from "lucide-react"
import { formatKey, todayKey } from "@/lib/date"
import type { Occurrence } from "@/lib/calendar/recurrence"
import { CategoryTag } from "./CategoryBadge"

const DEFAULT_COLOR = "#f43f5e"

const REMINDER_TEXT: Record<number, string> = {
  0: "At time",
  10: "10 min before",
  30: "30 min before",
  60: "1 hour before",
  1440: "1 day before",
}

interface AgendaViewProps {
  occurrences: Occurrence[]
  onSelectPlan: (occ: Occurrence) => void
}

/** Vista de agenda: ocurrencias cronológicas agrupadas por día. */
export const AgendaView: React.FC<AgendaViewProps> = ({ occurrences, onSelectPlan }) => {
  if (occurrences.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <Calendar className="mx-auto mb-3 h-12 w-12 text-pink-300" />
        <p>Nothing scheduled ahead. Add a plan or a task!</p>
      </div>
    )
  }

  // agrupar por dateKey preservando el orden
  const groups: { key: string; items: Occurrence[] }[] = []
  for (const occ of occurrences) {
    const last = groups[groups.length - 1]
    if (last && last.key === occ.dateKey) last.items.push(occ)
    else groups.push({ key: occ.dateKey, items: [occ] })
  }

  const today = todayKey()

  return (
    <div className="custom-scrollbar max-h-[560px] space-y-5 overflow-y-auto pr-1">
      {groups.map((group) => (
        <div key={group.key} className="flex gap-4">
          {/* columna de fecha */}
          <div className="w-16 shrink-0 text-right">
            <div className={`text-2xl font-bold ${group.key === today ? "text-rose-500" : "text-gray-700"}`}>
              {formatKey(group.key, { day: "numeric" })}
            </div>
            <div className="text-xs uppercase text-gray-400">{formatKey(group.key, { weekday: "short" })}</div>
            <div className="text-xs text-gray-400">{formatKey(group.key, { month: "short" })}</div>
          </div>

          {/* eventos del día */}
          <div className="flex-1 space-y-2">
            {group.items.map((occ) => {
              const p = occ.plan
              const color = p.color || DEFAULT_COLOR
              return (
                <button
                  key={`${p.id}-${occ.dateKey}`}
                  type="button"
                  onClick={() => onSelectPlan(occ)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-pink-100 bg-white/70 p-3 text-left shadow-sm transition-all hover:shadow-md"
                >
                  <span className="mt-1 h-full w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <div className={`flex items-center gap-2 font-semibold text-gray-800 ${p.completed ? "text-gray-400 line-through" : ""}`}>
                      {p.is_task && <ListTodo className="h-4 w-4 shrink-0 text-violet-500" />}
                      {p.title}
                      {occ.recurring && <Repeat className="h-3.5 w-3.5 text-rose-400" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <CategoryTag category={p.category} />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.all_day ? "All day" : p.time || "No time"}
                        {p.end_time ? ` – ${p.end_time}` : ""}
                      </span>
                      {p.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.location}
                        </span>
                      )}
                      {p.reminder_minutes !== null && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Bell className="h-3 w-3" />
                          {REMINDER_TEXT[p.reminder_minutes] ?? `${p.reminder_minutes} min before`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
