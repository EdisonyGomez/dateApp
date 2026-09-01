import type React from "react"
import { useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Plus, Clock, MapPin, ListTodo, Repeat, CalendarDays } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatKey } from "@/lib/date"
import type { Occurrence } from "@/lib/calendar/recurrence"
import type { Holiday } from "@/lib/calendar/holidays"
import { CategoryBadge, CategoryTag } from "./CategoryBadge"
import { CATEGORY_BY_ID } from "@/lib/calendar/eventCategory"

interface DayEventsDialogProps {
  dateKey: string | null
  occurrences: Occurrence[]
  holidays: Holiday[]
  isDone: (occ: Occurrence) => boolean
  onSelectOccurrence: (occ: Occurrence) => void
  onSelectHoliday: (h: Holiday) => void
  onAdd: (dateKey: string) => void
  onClose: () => void
}

/**
 * Modal con TODOS los eventos y festivos de un día (al tocar el día en el mes).
 * El DialogContent de Radix queda transparente (centra + cierra + atrapa foco);
 * la card de vidrio interna es la que tiene profundidad y hace el tilt 3D.
 */
export const DayEventsDialog: React.FC<DayEventsDialogProps> = ({
  dateKey,
  occurrences,
  holidays,
  isDone,
  onSelectOccurrence,
  onSelectHoliday,
  onAdd,
  onClose,
}) => {
  const total = occurrences.length
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  // acento = color de la categoría del primer evento
  const accent = occurrences[0] ? CATEGORY_BY_ID[occurrences[0].plan.category].color : "#f43f5e"

  // tilt 3D siguiendo el cursor (solo mouse; se apaga con reduced-motion)
  const handleTilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse" || !cardRef.current) return
    const el = cardRef.current
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`
  }
  const resetTilt = () => {
    if (cardRef.current) cardRef.current.style.transform = ""
  }

  return (
    <Dialog open={!!dateKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md [perspective:1200px]">
        {dateKey && (
          <div
            ref={cardRef}
            onPointerMove={handleTilt}
            onPointerLeave={resetTilt}
            className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white/85 p-6 shadow-2xl backdrop-blur-md transition-transform duration-150 ease-out [transform-style:preserve-3d]"
          >
            {/* glow del acento */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, ${accent}66, transparent 70%)` }}
            />

            <DialogHeader className="relative">
              <DialogTitle className="font-quick text-2xl capitalize">
                {formatKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
              </DialogTitle>
              <DialogDescription>
                {total === 0 && holidays.length === 0
                  ? "Nothing scheduled"
                  : `${total} event${total !== 1 ? "s" : ""}${holidays.length ? ` · ${holidays.length} holiday${holidays.length !== 1 ? "s" : ""}` : ""}`}
              </DialogDescription>
            </DialogHeader>

            <div className="custom-scrollbar relative mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {holidays.map((h, i) => (
                <motion.button
                  key={`h-${i}`}
                  type="button"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : i * 0.05 }}
                  onClick={() => onSelectHoliday(h)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:brightness-95 ${
                    h.country === "CO" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"
                  }`}
                >
                  <span className="text-lg">{h.flag}</span>
                  <span className="font-medium">{h.name}</span>
                </motion.button>
              ))}

              {occurrences.map((occ, i) => {
                const p = occ.plan
                const done = isDone(occ)
                return (
                  <motion.button
                    key={`${p.id}-${i}`}
                    type="button"
                    initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: reduced ? 0 : (holidays.length + i) * 0.05, type: "spring", stiffness: 380, damping: 30 }}
                    whileHover={reduced ? undefined : { y: -2 }}
                    onClick={() => onSelectOccurrence(occ)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-pink-100 bg-white/80 p-3 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CategoryBadge category={p.category} size="md" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className={`font-quick flex items-center gap-1.5 font-semibold text-gray-800 ${done ? "text-gray-400 line-through" : ""}`}>
                        {p.is_task && <ListTodo className="h-4 w-4 shrink-0 text-violet-500" />}
                        <span className="truncate">{p.title}</span>
                        {occ.recurring && <Repeat className="h-3 w-3 shrink-0 text-rose-400" />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <CategoryTag category={p.category} />
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
                      </div>
                    </div>
                  </motion.button>
                )
              })}

              {total === 0 && holidays.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <CalendarDays className="mx-auto mb-2 h-10 w-10 text-pink-200" />
                  <p className="text-sm">Nothing this day. Add a plan or a task!</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => onAdd(dateKey)}
              className="font-quick relative mt-4 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-lg active:scale-[0.99]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add on this day
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
