import type React from "react"
import { motion } from "framer-motion"
import { Plus, Clock, MapPin, ListTodo, Repeat } from "lucide-react"
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
import { CategoryTag } from "./CategoryBadge"

const DEFAULT_COLOR = "#f43f5e"

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

/** Modal con TODOS los eventos y festivos de un día (al tocar el día en el mes). */
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
  return (
    <Dialog open={!!dateKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        {dateKey && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {formatKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
              </DialogTitle>
              <DialogDescription>
                {total === 0 && holidays.length === 0
                  ? "Nothing scheduled"
                  : `${total} event${total !== 1 ? "s" : ""}${holidays.length ? ` · ${holidays.length} holiday${holidays.length !== 1 ? "s" : ""}` : ""}`}
              </DialogDescription>
            </DialogHeader>

            <div className="custom-scrollbar max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {holidays.map((h, i) => (
                <motion.button
                  key={`h-${i}`}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (holidays.length + i) * 0.04 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => onSelectOccurrence(occ)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-pink-100 bg-white p-3 text-left transition-shadow hover:shadow-md"
                  >
                    <span
                      className="mt-0.5 w-1 self-stretch rounded-full"
                      style={{ backgroundColor: p.color || DEFAULT_COLOR }}
                    />
                    <div className="flex-1">
                      <div className={`flex items-center gap-1.5 font-semibold text-gray-800 ${done ? "text-gray-400 line-through" : ""}`}>
                        {p.is_task && <ListTodo className="h-4 w-4 shrink-0 text-violet-500" />}
                        {p.title}
                        {occ.recurring && <Repeat className="h-3 w-3 text-rose-400" />}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
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
                <p className="py-6 text-center text-sm text-gray-400">No events this day.</p>
              )}
            </div>

            <Button
              onClick={() => onAdd(dateKey)}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 transition-all hover:from-rose-600 hover:to-pink-600 active:scale-[0.99]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add on this day
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
