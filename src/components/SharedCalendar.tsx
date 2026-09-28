"use client"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  Calendar,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  User,
  Bell,
  BellRing,
  ListTodo,
  CalendarRange,
  Repeat,
  Pencil,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { useSharedPlans, type Plan } from "@/hooks/useSharedPlans"
import { useNotifications } from "@/hooks/useNotifications"
import { useReminderScheduler } from "@/hooks/useReminderScheduler"
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { useWeather } from "@/hooks/useWeather"
import { WeatherFX } from "@/components/calendar/WeatherFX"
import { toDateKey, todayKey, formatKey, addDays, keyFromDate } from "@/lib/date"
import { occurrencesByDay, upcomingOccurrences, type Occurrence } from "@/lib/calendar/recurrence"
import { holidaysByDateKey, type Holiday } from "@/lib/calendar/holidays"
import { PlanForm } from "@/components/calendar/PlanForm"
import { AgendaView } from "@/components/calendar/AgendaView"
import { TimeGridView } from "@/components/calendar/TimeGridView"
import { DayEventsDialog } from "@/components/calendar/DayEventsDialog"
import { DeleteRecurringDialog, type DeleteMode } from "@/components/calendar/DeleteRecurringDialog"
import { CategoryBadge, CategoryTag } from "@/components/calendar/CategoryBadge"
import { categoryOf } from "@/lib/calendar/eventCategory"
import { CalendarHeader } from "@/components/calendar/CalendarHeader"
import { AmbientCanvas } from "@/components/calendar/AmbientCanvas"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"

type View = "month" | "week" | "day" | "agenda"
const VIEWS: { id: View; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
]

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Slide direccional del grid al cambiar de mes (custom = dirección de navegación). */
const monthVariants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 36 : d < 0 ? -36 : 0 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -36 : d < 0 ? 36 : 0 }),
}

/** Agrupa ocurrencias en secciones: Today / Tomorrow / This week / por mes. */
const groupUpcoming = (occs: Occurrence[]): { label: string; items: Occurrence[] }[] => {
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)
  const order: string[] = []
  const map = new Map<string, Occurrence[]>()
  for (const occ of occs) {
    const d = occ.dateKey
    const label =
      d === today ? "Today" : d === tomorrow ? "Tomorrow" : d <= weekEnd ? "This week" : formatKey(d, { month: "long", year: "numeric" })
    if (!map.has(label)) {
      map.set(label, [])
      order.push(label)
    }
    map.get(label)!.push(occ)
  }
  return order.map((label) => ({ label, items: map.get(label)! }))
}

export const SharedCalendar: React.FC = () => {
  const { user, partner, profile } = useAuth()
  const notif = useNotifications()

  const onPartnerInsert = useCallback(
    (plan: Plan) => {
      notif.notify(
        `${partner?.name || "Your partner"} added a ${plan.is_task ? "task" : "plan"} 💕`,
        { body: plan.title, tag: `partner-${plan.id}` },
      )
    },
    [notif, partner],
  )

  const {
    plans,
    loading,
    addPlan,
    updatePlan,
    removePlan,
    deleteOccurrence,
    deleteFutureFrom,
    isOccurrenceDone,
    toggleOccurrence,
    refetch,
  } = useSharedPlans({ onPartnerInsert })
  useReminderScheduler(plans, notif.notify)
  const google = useGoogleCalendar({ onSynced: refetch })
  const weather = useWeather()

  // intent "✓ Done" desde la notificación: /?complete=<planId>&date=<YYYY-MM-DD>
  useEffect(() => {
    if (plans.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const planId = params.get("complete")
    const date = params.get("date")
    if (!planId || !date) return
    const plan = plans.find((p) => p.id === planId)
    if (plan && !isOccurrenceDone(plan, date)) toggleOccurrence(plan, date)
    // limpia la URL para no re-disparar
    window.history.replaceState({}, "", window.location.pathname)
  }, [plans, isOccurrenceDone, toggleOccurrence])

  const [view, setView] = useState<View>("month")
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [prefill, setPrefill] = useState<{ date?: string; time?: string } | null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [selected, setSelected] = useState<{ plan: Plan; dateKey: string } | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ plan: Plan; dateKey: string } | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [navDir, setNavDir] = useState(0)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)

  const openDetail = (plan: Plan, dateKey: string) => setSelected({ plan, dateKey })

  /** Empuja los cambios locales a Google en segundo plano (si está conectado). */
  const syncGoogleSoon = () => {
    if (google.status?.connected) void google.sync({ silent: true, background: true })
  }

  /** Borrar: recurrente → diálogo de opciones; único → borra directo. */
  const requestDelete = async (plan: Plan, dateKey: string) => {
    setSelected(null)
    if (plan.rrule) {
      setDeleteTarget({ plan, dateKey })
    } else {
      await removePlan(plan.id)
      syncGoogleSoon()
    }
  }
  const handleDeleteChoice = async (mode: DeleteMode) => {
    if (!deleteTarget) return
    const { plan, dateKey } = deleteTarget
    if (mode === "this") await deleteOccurrence(plan, dateKey)
    else if (mode === "future") await deleteFutureFrom(plan, dateKey)
    else await removePlan(plan.id)
    setDeleteTarget(null)
    syncGoogleSoon()
  }

  const showForm = showAddPlan || !!editingPlan
  const closeForm = () => {
    setShowAddPlan(false)
    setEditingPlan(null)
    setPrefill(null)
  }
  const handleFormSubmit = async (input: Parameters<typeof addPlan>[0]) => {
    const ok = editingPlan ? await updatePlan(editingPlan.id, input) : await addPlan(input)
    if (ok) {
      closeForm()
      syncGoogleSoon()
    }
    return ok
  }
  const openEdit = (plan: Plan) => {
    setSelected(null)
    setEditingPlan(plan)
  }
  const openCreate = (pf: { date?: string; time?: string } | null = null) => {
    setPrefill(pf)
    setEditingPlan(null)
    setShowAddPlan(true)
  }

  /* ───────── rango visible según la vista ───────── */
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const anchorKey = keyFromDate(currentDate)
  const weekStart = addDays(anchorKey, -currentDate.getDay())
  const weekEnd = addDays(weekStart, 6)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const { first, last } = useMemo(() => {
    if (view === "week") return { first: weekStart, last: weekEnd }
    if (view === "day") return { first: anchorKey, last: anchorKey }
    if (view === "agenda") return { first: anchorKey, last: anchorKey }
    const f = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
    const l = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`
    return { first: f, last: l }
  }, [view, weekStart, weekEnd, anchorKey, currentYear, currentMonth, daysInMonth])

  const occMap = useMemo(() => occurrencesByDay(plans, first, last), [plans, first, last])
  const holidayMap = useMemo(() => {
    const years = new Set([Number(first.slice(0, 4)), Number(last.slice(0, 4))])
    const map = new Map<string, Holiday[]>()
    years.forEach((y) =>
      holidaysByDateKey(y).forEach((v, k) => map.set(k, (map.get(k) ?? []).concat(v))),
    )
    return map
  }, [first, last])
  const upcoming = useMemo(() => upcomingOccurrences(plans, todayKey(), 365), [plans])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  /* ───────── navegación adaptativa ───────── */
  const shift = (dir: number) => {
    setNavDir(dir)
    setCurrentDate((d) => {
      if (view === "month") return new Date(d.getFullYear(), d.getMonth() + dir, 1)
      const step = view === "week" ? 7 : 1
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir * step)
    })
  }

  const title =
    view === "month"
      ? currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "week"
        ? `${formatKey(weekStart, { month: "short", day: "numeric" })} – ${formatKey(weekEnd, { month: "short", day: "numeric", year: "numeric" })}`
        : view === "day"
          ? formatKey(anchorKey, { weekday: "long", month: "long", day: "numeric" })
          : "Agenda"

  /* ───────── toolbar ───────── */
  const renderToolbar = () => (
    <div
      className="relative overflow-hidden rounded-3xl p-3 shadow-lg transition-[background] duration-700 ease-out sm:p-4"
      style={{ background: weather.bg }}
    >
      <WeatherFX weather={weather.key} />
      <div className="relative z-10 space-y-2.5">
      {/* Fila 1: identidad de la pareja + acciones rápidas (notif, Google) */}
      <div className="flex items-start justify-between gap-2">
        <CalendarHeader
          me={{ name: profile?.name || user?.email || "You", avatarUrl: profile?.avatar_url }}
          partner={partner ? { name: partner.name, avatarUrl: partner.avatar_url } : null}
          weather={{ label: weather.label, icon: weather.icon, tempC: weather.tempC, fg: weather.fg }}
        />
        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/75 p-1 shadow-sm backdrop-blur-md">
          {notif.supported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                notif.pushConfigured && user ? notif.enablePush(user.id) : notif.requestPermission()
              }
              title={notif.permission === "granted" ? "Notifications on" : "Enable notifications"}
              aria-label="Notifications"
              className="h-9 w-9 rounded-full hover:bg-pink-50"
            >
              {notif.permission === "granted" ? (
                <BellRing className="h-[18px] w-[18px] text-rose-500" />
              ) : (
                <Bell className="h-[18px] w-[18px] text-gray-500" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (google.status?.connected ? google.sync() : google.connect())}
            disabled={google.connecting || google.syncing}
            title={
              google.status?.connected
                ? `Sincronizar con Google Calendar${google.status.email ? ` (${google.status.email})` : ""}`
                : "Conectar Google Calendar"
            }
            aria-label={google.status?.connected ? "Sincronizar con Google Calendar" : "Conectar Google Calendar"}
            className="relative h-9 w-9 rounded-full hover:bg-pink-50"
          >
            {google.connecting || google.syncing ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin text-rose-500" />
            ) : (
              <GoogleIcon className="h-[18px] w-[18px]" />
            )}
            {google.status?.connected && !google.syncing && !google.connecting && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Fila 2: navegación de fecha (propia, no se apila) */}
      {view !== "agenda" ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/75 p-1 pl-1.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shift(-1)}
              aria-label="Mes anterior"
              className="h-9 w-9 shrink-0 rounded-full text-rose-600 hover:bg-pink-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-quick min-w-[8.5rem] text-center text-base font-bold capitalize text-gray-800 sm:text-lg">
              {title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shift(1)}
              aria-label="Mes siguiente"
              className="h-9 w-9 shrink-0 rounded-full text-rose-600 hover:bg-pink-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={() => {
              setNavDir(0)
              setCurrentDate(new Date())
            }}
            className="h-8 shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 text-xs font-bold text-white shadow hover:from-rose-600 hover:to-pink-600"
          >
            Today
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/75 px-4 py-2.5 text-center font-quick text-lg font-bold text-gray-800 shadow-sm backdrop-blur-md">
          Agenda
        </div>
      )}

      {/* switcher de vistas — pill rosa degradado sobre glass (legible en cualquier clima) */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/55 p-1 shadow-sm backdrop-blur-md">
        {VIEWS.map((v) => {
          const active = view === v.id
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className="relative rounded-xl py-1.5 text-sm font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="cal-view-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 shadow-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`font-quick relative z-10 ${active ? "text-white" : "text-gray-500 hover:text-rose-500"}`}>
                {v.label}
              </span>
            </button>
          )
        })}
      </div>

      <Button
        onClick={() => openCreate(null)}
        className="font-quick w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-6 text-base font-semibold shadow-lg transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-xl active:scale-[0.99]"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add plan or task
      </Button>
      </div>
    </div>
  )

  /* ───────── month grid ───────── */
  const renderMonthGrid = () => {
    const today = new Date()
    const startingDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
    const cells: React.ReactNode[] = []
    for (let i = 0; i < startingDayOfWeek; i++) cells.push(<div key={`e-${i}`} className="h-16 sm:h-24" />)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayOccs = occMap.get(dateStr) ?? []
      const dayHolidays = holidayMap.get(dateStr) ?? []
      const isToday =
        today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
      const wday = new Date(currentYear, currentMonth, day).getDay()
      const isWeekend = wday === 0 || wday === 6
      // glow del día = color de la categoría del primer evento (da vida + información)
      const topCat = dayOccs[0] ? categoryOf(dayOccs[0].plan.category) : null
      const glowColor = topCat?.color ?? null

      cells.push(
        <div
          key={day}
          onClick={() => setSelectedDay(dateStr)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setSelectedDay(dateStr)
            }
          }}
          aria-label={`${formatKey(dateStr, { day: "numeric", month: "long" })}${
            dayOccs.length ? `, ${dayOccs.length} event${dayOccs.length !== 1 ? "s" : ""}` : ""
          }`}
          className={`group relative flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border p-1 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:h-24 sm:gap-1.5 sm:rounded-2xl sm:p-1.5 ${
            isToday
              ? "cal-day-today border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100"
              : isWeekend
                ? "border-pink-100/70 bg-gradient-to-br from-rose-50 to-pink-50/60 hover:from-rose-100/70"
                : "border-pink-100/70 bg-gradient-to-br from-white to-pink-50/40 hover:from-pink-50"
          }`}
        >
          {glowColor && !isToday && (
            <div
              className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-90"
              style={{ background: `radial-gradient(circle at 50% 120%, ${glowColor}, transparent 62%)` }}
            />
          )}

          {/* feriados: banderita en la esquina → abre el detalle del feriado */}
          {dayHolidays.length > 0 && (
            <div className="absolute right-0.5 top-0.5 z-20 flex gap-0.5 sm:right-1 sm:top-1">
              {dayHolidays.slice(0, 2).map((hol, i) => (
                <button
                  key={`h-${i}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedHoliday(hol)
                  }}
                  className={`rounded px-0.5 text-[8px] font-bold uppercase leading-tight shadow-sm transition hover:scale-110 sm:px-1 sm:text-[9px] ${
                    hol.country === "CO" ? "bg-amber-200 text-amber-800" : "bg-blue-200 text-blue-800"
                  }`}
                  title={`${hol.flag} ${hol.name}`}
                >
                  {hol.flag}
                </button>
              ))}
            </div>
          )}

          <span className={`font-quick relative z-10 text-sm font-bold leading-none sm:text-base ${isToday ? "text-rose-700" : "text-gray-700"}`}>{day}</span>

          {/* MÓVIL: chip compacto — 1 evento = punto; 2+ = contador con el color de la categoría dominante */}
          {dayOccs.length > 0 && topCat && (
            <div className="relative z-10 flex items-center justify-center sm:hidden">
              {dayOccs.length === 1 ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${dayOccs[0].plan.completed ? "opacity-40" : ""}`}
                  style={{ backgroundColor: topCat.color, boxShadow: `0 0 5px ${topCat.color}` }}
                />
              ) : (
                <span
                  className="flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-bold leading-none shadow-sm"
                  style={{ backgroundColor: topCat.soft, color: topCat.color }}
                >
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: topCat.color }} />
                  {dayOccs.length}
                </span>
              )}
            </div>
          )}

          {/* DESKTOP: fila de puntos, coloreados por categoría */}
          <div className="relative z-10 hidden h-2 items-center justify-center gap-1 sm:flex">
            {dayOccs.slice(0, 5).map((occ, i) => {
              const c = categoryOf(occ.plan.category).color
              return (
                <span
                  key={`${occ.plan.id}-${i}`}
                  className={`h-1.5 w-1.5 rounded-full ${occ.plan.completed ? "opacity-40" : ""}`}
                  style={{ backgroundColor: c, boxShadow: `0 0 5px ${c}` }}
                />
              )
            })}
            {dayOccs.length > 5 && (
              <span className="text-[9px] font-semibold text-rose-500">+{dayOccs.length - 5}</span>
            )}
          </div>
        </div>,
      )
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-gray-500 sm:py-2 sm:text-sm">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 rounded-2xl bg-gradient-to-br from-white/40 to-pink-50/20 p-1 sm:gap-2 sm:rounded-3xl sm:p-2">{cells}</div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 sm:gap-4">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-amber-100" /> 🇨🇴 Colombia holiday
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-blue-100" /> 🇺🇸 USA holiday
          </span>
        </div>
      </div>
    )
  }

  /* ───────── upcoming list (agrupada) ───────── */
  const renderUpcomingItem = (occ: Occurrence) => {
    const p = occ.plan
    const multi = !occ.recurring && !!p.end_date && toDateKey(p.end_date) !== toDateKey(p.date)
    const done = isOccurrenceDone(p, occ.dateKey)
    const catColor = categoryOf(p.category).color
    return (
      <div key={`${p.id}-${occ.dateKey}`} className="group relative overflow-hidden rounded-2xl border border-pink-100/70 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg">
        {/* glow suave de la categoría al hacer hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-8 top-1/2 z-0 h-28 w-28 -translate-y-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
          style={{ background: catColor }}
        />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <CategoryBadge category={p.category} size="md" className="mt-0.5" />
            {p.is_task && (
              <Checkbox checked={done} onCheckedChange={() => toggleOccurrence(p, occ.dateKey)} className="mt-0.5" aria-label="Complete task" />
            )}
            <div className="flex-1 cursor-pointer" onClick={() => openDetail(p, occ.dateKey)}>
              <h5 className={`font-quick mb-1 flex items-center gap-2 font-semibold text-gray-800 ${done ? "text-gray-400 line-through" : ""}`}>
                {p.is_task && <ListTodo className="h-4 w-4 shrink-0 text-violet-500" />}
                {p.title}
                {occ.recurring && <Repeat className="h-3.5 w-3.5 text-rose-400" />}
              </h5>
              {p.description && <p className="mb-2 text-sm text-gray-600">{p.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <CategoryTag category={p.category} />
                <span className="flex items-center gap-1">
                  {multi ? <CalendarRange className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  {occ.recurring ? formatKey(occ.dateKey, { day: "numeric", month: "short", year: "numeric" }) : rangeLabel(p.date, p.end_date)}
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
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="rounded-full text-gray-400 hover:bg-pink-50 hover:text-rose-600" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => requestDelete(p, occ.dateKey)} className="rounded-full text-red-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderUpcoming = () => {
    const sections = groupUpcoming(upcoming)
    return (
      <div className="mt-4">
        <h4 className="font-quick mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
          <Clock className="h-6 w-6 text-rose-500" />
          Upcoming plans &amp; tasks
        </h4>
        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-pink-300" />
            <p>Nothing coming up. Add a plan or a task!</p>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[30rem] space-y-6 overflow-y-auto pr-1">
            {sections.map((sec) => (
              <div key={sec.label}>
                {/* título de sección */}
                <div className="sticky top-0 z-10 mb-2.5 flex items-center gap-2 bg-white/70 py-1.5 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                  <h5 className="font-quick text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{sec.label}</h5>
                  <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {sec.items.length}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-pink-200 to-transparent" />
                </div>
                <div className="space-y-3">{sec.items.map(renderUpcomingItem)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderBody = () => (
    <MotionConfig reducedMotion="user">
    <div className="space-y-6">
      {renderToolbar()}
      {view === "month" && (
        <>
          <AnimatePresence mode="wait" custom={navDir} initial={false}>
            <motion.div
              key={`${currentYear}-${currentMonth}`}
              custom={navDir}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {renderMonthGrid()}
            </motion.div>
          </AnimatePresence>
          {renderUpcoming()}
        </>
      )}
      {(view === "week" || view === "day") && (
        <TimeGridView
          days={view === "week" ? weekDays : [anchorKey]}
          occByDay={occMap}
          holidaysByDay={holidayMap}
          onSelectPlan={(occ) => openDetail(occ.plan, occ.dateKey)}
          onSelectHoliday={(h) => setSelectedHoliday(h)}
          onCreateAt={(date, time) => openCreate({ date, time })}
        />
      )}
      {view === "agenda" && (
        <AgendaView occurrences={upcoming} onSelectPlan={(occ) => openDetail(occ.plan, occ.dateKey)} />
      )}
    </div>
    </MotionConfig>
  )

  if (loading && plans.length === 0) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <AmbientCanvas />
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
      <Card className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white/80 p-4 shadow-xl backdrop-blur-sm sm:p-8">
        <AmbientCanvas />
        <CardContent className="relative z-10 p-0">
          {showForm ? (
            <PlanForm initial={editingPlan} prefill={prefill} onSubmit={handleFormSubmit} onCancel={closeForm} />
          ) : (
            renderBody()
          )}
        </CardContent>
      </Card>

      {/* Plan detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          {selected &&
            (() => {
              const p = selected.plan
              const done = isOccurrenceDone(p, selected.dateKey)
              const isOwner = user && p.created_by === user.id
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-quick flex items-center gap-2 text-2xl">
                      <CategoryBadge category={p.category} size="sm" />
                      {p.is_task && <ListTodo className="h-5 w-5 text-violet-500" />}
                      <span className={done ? "text-gray-400 line-through" : ""}>{p.title}</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">Plan details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm text-gray-600">
                    <CategoryTag category={p.category} />
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-rose-400" />
                      {p.rrule
                        ? formatKey(selected.dateKey, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                        : rangeLabel(p.date, p.end_date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-rose-400" />
                      {p.all_day ? "All day" : p.time || "No time"}
                      {p.end_time ? ` – ${p.end_time}` : ""}
                    </p>
                    {p.rrule && (
                      <p className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-rose-400" />
                        Repeating event
                      </p>
                    )}
                    {p.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-400" />
                        {p.location}
                      </p>
                    )}
                    {p.reminder_minutes !== null && (
                      <p className="flex items-center gap-2 text-amber-600">
                        <Bell className="h-4 w-4" />
                        {reminderLabel(p.reminder_minutes)}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      {p.plan_type === "individual" ? <User className="h-4 w-4 text-rose-400" /> : <Users className="h-4 w-4 text-rose-400" />}
                      {p.created_by_name}
                      {p.plan_type === "together" && ` & ${partner?.name || "your partner"}`}
                    </p>
                    {p.description && <p className="whitespace-pre-wrap pt-2 text-gray-700">{p.description}</p>}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.is_task && (
                      <Button
                        onClick={() => toggleOccurrence(p, selected.dateKey)}
                        variant={done ? "outline" : "default"}
                        className={done ? "flex-1 rounded-xl" : "flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"}
                      >
                        {done ? <RotateCcw className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                        {done ? "Undo" : "Mark done"}
                      </Button>
                    )}
                    {isOwner && (
                      <>
                        <Button onClick={() => openEdit(p)} className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => requestDelete(p, selected.dateKey)}
                          className="rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* Holiday info modal */}
      <Dialog open={!!selectedHoliday} onOpenChange={(open) => !open && setSelectedHoliday(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          {selectedHoliday && (
            <>
              <DialogHeader>
                <div className="mb-2 text-5xl">{selectedHoliday.flag}</div>
                <DialogTitle className="font-quick text-2xl">{selectedHoliday.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1 text-sm">
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 font-medium text-rose-600">
                    {COUNTRY_NAME[selectedHoliday.country]}
                  </span>
                  <span>{formatKey(selectedHoliday.dateKey, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </DialogDescription>
              </DialogHeader>
              <p className="text-gray-600">{selectedHoliday.description}</p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* All events of a day (month view) */}
      <DayEventsDialog
        dateKey={selectedDay}
        occurrences={selectedDay ? occMap.get(selectedDay) ?? [] : []}
        holidays={selectedDay ? holidayMap.get(selectedDay) ?? [] : []}
        isDone={(occ) => isOccurrenceDone(occ.plan, occ.dateKey)}
        onSelectOccurrence={(occ) => {
          setSelectedDay(null)
          openDetail(occ.plan, occ.dateKey)
        }}
        onSelectHoliday={(h) => {
          setSelectedDay(null)
          setSelectedHoliday(h)
        }}
        onAdd={(dk) => {
          setSelectedDay(null)
          openCreate({ date: dk })
        }}
        onClose={() => setSelectedDay(null)}
      />

      {/* Delete a recurring event: this / following / all */}
      <DeleteRecurringDialog
        open={!!deleteTarget}
        title={deleteTarget?.plan.title}
        onChoice={handleDeleteChoice}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
