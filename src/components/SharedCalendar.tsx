"use client"
import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import {
  Calendar,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Sparkles,
  X,
  Users,
  User,
  Bell,
  ListTodo,
  CalendarRange,
  Repeat,
} from "lucide-react"
import { useSharedPlans } from "@/hooks/useSharedPlans"
import { toDateKey, todayKey, formatKey } from "@/lib/date"
import { occurrencesByDay, upcomingOccurrences } from "@/lib/calendar/recurrence"
import { holidaysByDateKey, type Holiday } from "@/lib/calendar/holidays"
import { PlanForm } from "@/components/calendar/PlanForm"

const REMINDER_TEXT: Record<number, string> = {
  0: "At time of event",
  10: "10 min before",
  30: "30 min before",
  60: "1 hour before",
  1440: "1 day before",
}
const reminderLabel = (m: number) => REMINDER_TEXT[m] ?? `${m} min before`

const COUNTRY_NAME: Record<Holiday["country"], string> = {
  CO: "Colombia",
  US: "United States",
}

const rangeLabel = (start: string, end: string | null): string => {
  const s = toDateKey(start)
  const e = end ? toDateKey(end) : s
  if (e === s) return formatKey(s, { day: "numeric", month: "short", year: "numeric" })
  return `${formatKey(s, { day: "numeric", month: "short" })} – ${formatKey(e, { day: "numeric", month: "short", year: "numeric" })}`
}

const DEFAULT_COLOR = "#f43f5e"
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const SharedCalendar: React.FC = () => {
  const { user, partner } = useAuth()
  const { plans, loading, addPlan, removePlan, toggleComplete } = useSharedPlans()

  const [showAddPlan, setShowAddPlan] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const monthOccurrences = useMemo(() => {
    const firstKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const lastKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    return occurrencesByDay(plans, firstKey, lastKey)
  }, [plans, currentMonth, currentYear])

  const holidays = useMemo(() => holidaysByDateKey(currentYear), [currentYear])
  const upcoming = useMemo(() => upcomingOccurrences(plans, todayKey(), 365), [plans])

  const handleAdd = async (input: Parameters<typeof addPlan>[0]) => {
    const ok = await addPlan(input)
    if (ok) setShowAddPlan(false)
    return ok
  }

  /* ───────── grid ───────── */
  const renderCalendarView = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()

    const cells: React.ReactNode[] = []
    for (let i = 0; i < startingDayOfWeek; i++) cells.push(<div key={`e-${i}`} className="h-24" />)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayOccs = monthOccurrences.get(dateStr) ?? []
      const dayHolidays = holidays.get(dateStr) ?? []
      const isToday =
        today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear

      cells.push(
        <div
          key={day}
          className={`h-24 overflow-hidden rounded-xl border p-1.5 transition-all duration-300 ${
            isToday
              ? "border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100"
              : "border-pink-100 bg-white hover:bg-pink-50"
          }`}
        >
          <div className={`mb-1 text-sm font-semibold ${isToday ? "text-rose-700" : "text-gray-700"}`}>{day}</div>
          <div className="space-y-0.5">
            {/* holidays */}
            {dayHolidays.map((hol, i) => (
              <button
                key={`h-${i}`}
                type="button"
                onClick={() => setSelectedHoliday(hol)}
                className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  hol.country === "CO"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
                title={`${hol.flag} ${hol.name}`}
              >
                <span>{hol.flag}</span>
                <span className="truncate">{hol.name}</span>
              </button>
            ))}
            {/* plans */}
            {dayOccs.slice(0, dayHolidays.length > 0 ? 1 : 2).map((occ, i) => {
              const p = occ.plan
              const color = p.color || DEFAULT_COLOR
              return (
                <div
                  key={`${p.id}-${i}`}
                  className={`flex cursor-pointer items-center gap-1 truncate rounded-full px-2 py-0.5 text-xs text-white ${p.completed ? "opacity-50 line-through" : ""}`}
                  style={{ backgroundColor: color }}
                  title={`${p.title}${p.time ? ` · ${p.time}` : ""}`}
                  onClick={() =>
                    toast.info(`${p.title}${p.time ? ` · ${p.time}` : p.all_day ? " · All day" : ""}`)
                  }
                >
                  {p.is_task ? (
                    <ListTodo className="h-3 w-3 shrink-0" />
                  ) : occ.recurring ? (
                    <Repeat className="h-3 w-3 shrink-0" />
                  ) : null}
                  <span className="truncate">{p.title}</span>
                </div>
              )
            })}
            {dayOccs.length > (dayHolidays.length > 0 ? 1 : 2) && (
              <div className="text-[10px] font-medium text-rose-500">
                +{dayOccs.length - (dayHolidays.length > 0 ? 1 : 2)} more
              </div>
            )}
          </div>
        </div>,
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <CalendarDays className="h-7 w-7 text-rose-500" />
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
              className="rounded-full border-pink-200 text-rose-600 hover:bg-pink-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-full border-pink-200 px-4 text-rose-600 hover:bg-pink-50"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
              className="rounded-full border-pink-200 text-rose-600 hover:bg-pink-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={() => setShowAddPlan(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-6 text-base font-semibold shadow-lg transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-xl active:scale-[0.99]"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add plan or task
        </Button>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-sm font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">{cells}</div>

        {/* legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-amber-100" /> 🇨🇴 Colombia holiday
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-blue-100" /> 🇺🇸 USA holiday
          </span>
        </div>

        {/* Upcoming */}
        <div className="mt-4">
          <h4 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
            <Clock className="h-6 w-6 text-rose-500" />
            Upcoming plans &amp; tasks
          </h4>
          <div className="custom-scrollbar max-h-72 space-y-3 overflow-y-auto">
            {upcoming.map((occ) => {
              const p = occ.plan
              const multi = !occ.recurring && !!p.end_date && toDateKey(p.end_date) !== toDateKey(p.date)
              const color = p.color || DEFAULT_COLOR
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-pink-100 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      {p.is_task && (
                        <Checkbox
                          checked={p.completed}
                          onCheckedChange={(c) => toggleComplete(p.id, Boolean(c))}
                          className="mt-0.5"
                          aria-label="Complete task"
                        />
                      )}
                      <div className="flex-1">
                        <h5 className={`mb-1 flex items-center gap-2 font-semibold text-gray-800 ${p.completed ? "text-gray-400 line-through" : ""}`}>
                          {p.is_task && <ListTodo className="h-4 w-4 shrink-0 text-violet-500" />}
                          {p.title}
                          {occ.recurring && <Repeat className="h-3.5 w-3.5 text-rose-400" />}
                        </h5>
                        {p.description && <p className="mb-2 text-sm text-gray-600">{p.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            {multi ? <CalendarRange className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                            {occ.recurring
                              ? formatKey(occ.dateKey, { day: "numeric", month: "short", year: "numeric" })
                              : rangeLabel(p.date, p.end_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {p.all_day ? "All day" : p.time || "No time"}
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
                              {reminderLabel(p.reminder_minutes)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500">
                          {p.plan_type === "individual" ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>{p.created_by_name} (Individual)</span>
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3" />
                              <span>
                                {p.created_by_name} &amp; {partner?.name || "your partner"} (Together)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {user && p.created_by === user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlan(p.id)}
                        className="rounded-full text-red-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {upcoming.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <CalendarDays className="mx-auto mb-3 h-12 w-12 text-pink-300" />
                <p>Nothing coming up. Add a plan or a task!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ParticleBackground = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      {[...Array(8)].map((_, i) => (
        <Heart
          key={`h-${i}`}
          className="absolute animate-pulse text-pink-300/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 15 + 10}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
      {[...Array(6)].map((_, i) => (
        <Star
          key={`s-${i}`}
          className="absolute animate-pulse text-yellow-300/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 12 + 8}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${Math.random() * 2 + 1}s`,
          }}
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <Sparkles
          key={`sp-${i}`}
          className="absolute animate-pulse text-pink-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 14 + 10}px`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${Math.random() * 4 + 2}s`,
          }}
        />
      ))}
    </div>
  )

  if (loading && plans.length === 0) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <ParticleBackground />
        <CardContent className="relative z-10 p-0">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <CalendarDays className="h-16 w-16 animate-pulse text-rose-500" />
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-rose-500 opacity-20" />
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-700">Loading calendar…</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <ParticleBackground />
        <CardContent className="relative z-10 p-0">
          {showAddPlan ? (
            <PlanForm onSubmit={handleAdd} onCancel={() => setShowAddPlan(false)} />
          ) : (
            renderCalendarView()
          )}
        </CardContent>
      </Card>

      {/* Holiday info modal */}
      <Dialog open={!!selectedHoliday} onOpenChange={(open) => !open && setSelectedHoliday(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          {selectedHoliday && (
            <>
              <DialogHeader>
                <div className="mb-2 text-5xl">{selectedHoliday.flag}</div>
                <DialogTitle className="text-2xl">{selectedHoliday.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1 text-sm">
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 font-medium text-rose-600">
                    {COUNTRY_NAME[selectedHoliday.country]}
                  </span>
                  <span>
                    {formatKey(selectedHoliday.dateKey, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <p className="text-gray-600">{selectedHoliday.description}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
