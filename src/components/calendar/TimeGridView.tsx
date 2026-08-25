import type React from "react"
import { useEffect, useRef } from "react"
import { ListTodo, Repeat } from "lucide-react"
import { formatKey, todayKey } from "@/lib/date"
import type { Occurrence } from "@/lib/calendar/recurrence"
import type { Holiday } from "@/lib/calendar/holidays"

const HOUR_HEIGHT = 48 // px por hora
const DEFAULT_COLOR = "#f43f5e"
// ancho mínimo por día → en mobile fuerza scroll horizontal legible; en desktop se reparte
const COL = "min-w-[6.5rem] flex-1 sm:min-w-0"

const parseMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}
const minToTime = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`

interface Positioned {
  occ: Occurrence
  start: number
  end: number
  lane: number
  lanes: number
}

/** Reparte en carriles los eventos que se solapan (packing simple). */
const layout = (occs: Occurrence[]): Positioned[] => {
  const timed = occs
    .filter((o) => o.plan.time && !o.plan.all_day)
    .map((o) => {
      const start = parseMin(o.plan.time as string)
      const end = o.plan.end_time ? Math.max(parseMin(o.plan.end_time), start + 30) : start + 60
      return { occ: o, start, end, lane: 0, lanes: 1 }
    })
    .sort((a, b) => a.start - b.start)

  const laneEnds: number[] = []
  for (const ev of timed) {
    let lane = laneEnds.findIndex((endMin) => endMin <= ev.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(ev.end)
    } else {
      laneEnds[lane] = ev.end
    }
    ev.lane = lane
  }
  const totalLanes = Math.max(1, laneEnds.length)
  return timed.map((ev) => ({ ...ev, lanes: totalLanes }))
}

interface TimeGridViewProps {
  days: string[]
  occByDay: Map<string, Occurrence[]>
  holidaysByDay: Map<string, Holiday[]>
  onSelectPlan: (occ: Occurrence) => void
  onSelectHoliday: (h: Holiday) => void
  onCreateAt: (dateKey: string, time: string) => void
}

export const TimeGridView: React.FC<TimeGridViewProps> = ({
  days,
  occByDay,
  holidaysByDay,
  onSelectPlan,
  onSelectHoliday,
  onCreateAt,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const today = todayKey()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // arranca mostrando ~7am
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-pink-100">
      {/* un solo contenedor con scroll horizontal → en mobile se desliza de lado */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* cabecera de días */}
          <div className="flex border-b border-pink-100 bg-pink-50/40">
            <div className="sticky left-0 z-20 w-12 shrink-0 bg-pink-50/60 sm:w-14" />
            {days.map((key) => {
              const isToday = key === today
              return (
                <div key={key} className={`${COL} border-l border-pink-100 py-2 text-center`}>
                  <div className="text-[11px] uppercase text-gray-400">{formatKey(key, { weekday: "short" })}</div>
                  <div
                    className={`mx-auto mt-0.5 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
                      isToday ? "bg-rose-500 text-white" : "text-gray-700"
                    }`}
                  >
                    {formatKey(key, { day: "numeric" })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* fila de todo el día + festivos */}
          <div className="flex border-b border-pink-100">
            <div className="sticky left-0 z-20 flex w-12 shrink-0 items-center justify-end bg-white pr-1 text-[9px] text-gray-400 sm:w-14 sm:text-[10px]">
              all-day
            </div>
            {days.map((key) => {
              const occs = occByDay.get(key) ?? []
              const allDay = occs.filter((o) => !(o.plan.time && !o.plan.all_day))
              const hols = holidaysByDay.get(key) ?? []
              return (
                <div key={key} className={`${COL} min-h-[34px] space-y-0.5 border-l border-pink-100 p-1`}>
                  {hols.map((h, i) => (
                    <button
                      key={`h-${i}`}
                      type="button"
                      onClick={() => onSelectHoliday(h)}
                      className={`flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                        h.country === "CO" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <span>{h.flag}</span>
                      <span className="truncate">{h.name}</span>
                    </button>
                  ))}
                  {allDay.map((o, i) => (
                    <button
                      key={`a-${i}`}
                      type="button"
                      onClick={() => onSelectPlan(o)}
                      className={`flex w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] text-white ${o.plan.completed ? "opacity-50 line-through" : ""}`}
                      style={{ backgroundColor: o.plan.color || DEFAULT_COLOR }}
                    >
                      {o.plan.is_task && <ListTodo className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{o.plan.title}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* grilla horaria (scroll vertical propio) */}
          <div ref={scrollRef} className="custom-scrollbar max-h-[460px] overflow-y-auto">
            <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
              {/* gutter de horas, fijo a la izquierda */}
              <div className="sticky left-0 z-20 w-12 shrink-0 bg-white sm:w-14">
                {hours.map((h) => (
                  <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                      {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                    </span>
                  </div>
                ))}
              </div>

              {/* columnas por día */}
              {days.map((key) => {
                const occs = occByDay.get(key) ?? []
                const positioned = layout(occs)
                return (
                  <div
                    key={key}
                    className={`${COL} relative border-l border-pink-100`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const y = e.clientY - rect.top
                      const min = Math.max(0, Math.min(23 * 60 + 30, Math.round((y / HOUR_HEIGHT) * 60 / 30) * 30))
                      onCreateAt(key, minToTime(min))
                    }}
                  >
                    {hours.map((h) => (
                      <div key={h} className="border-b border-pink-50" style={{ height: HOUR_HEIGHT }} />
                    ))}

                    {positioned.map((ev, i) => (
                      <button
                        key={`${ev.occ.plan.id}-${i}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPlan(ev.occ)
                        }}
                        className={`absolute overflow-hidden rounded-lg px-1.5 py-0.5 text-left text-[11px] leading-tight text-white shadow-sm ${ev.occ.plan.completed ? "opacity-50 line-through" : ""}`}
                        style={{
                          top: (ev.start / 60) * HOUR_HEIGHT,
                          height: Math.max(((ev.end - ev.start) / 60) * HOUR_HEIGHT - 2, 16),
                          left: `calc(${(ev.lane / ev.lanes) * 100}% + 2px)`,
                          width: `calc(${100 / ev.lanes}% - 4px)`,
                          backgroundColor: ev.occ.plan.color || DEFAULT_COLOR,
                        }}
                      >
                        <span className="flex items-center gap-1 font-medium">
                          {ev.occ.plan.is_task && <ListTodo className="h-3 w-3 shrink-0" />}
                          {ev.occ.recurring && <Repeat className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{ev.occ.plan.title}</span>
                        </span>
                        <span className="opacity-80">{ev.occ.plan.time}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
