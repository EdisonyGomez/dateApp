import type React from "react"
import { Repeat } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  describeRecurrence,
  type RecurrenceConfig,
  type RecurrencePreset,
  type RecurrenceUnit,
} from "@/lib/calendar/recurrence"

interface RecurrenceFieldProps {
  startKey: string
  value: RecurrenceConfig
  onChange: (config: RecurrenceConfig) => void
}

const PRESETS: { value: RecurrencePreset; label: string }[] = [
  { value: "none", label: "Doesn't repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "custom", label: "Custom…" },
]

const UNITS: { value: RecurrenceUnit; label: string }[] = [
  { value: "day", label: "days" },
  { value: "week", label: "weeks" },
  { value: "month", label: "months" },
  { value: "year", label: "years" },
]

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] // JS getDay 0..6 (Sun..Sat)

/**
 * Selector de recurrencia estilo Google: presets + panel "Personalizar"
 * con intervalo, días de la semana y condición de fin.
 */
export const RecurrenceField: React.FC<RecurrenceFieldProps> = ({
  startKey,
  value,
  onChange,
}) => {
  const set = (patch: Partial<RecurrenceConfig>) => onChange({ ...value, ...patch })
  const setEnd = (patch: Partial<RecurrenceConfig["end"]>) =>
    onChange({ ...value, end: { ...value.end, ...patch } })

  const toggleWeekday = (d: number) => {
    const has = value.weekdays.includes(d)
    set({
      weekdays: has ? value.weekdays.filter((w) => w !== d) : [...value.weekdays, d],
    })
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Repeat className="h-4 w-4 text-rose-500" />
        Repeat
      </label>

      <Select
        value={value.preset}
        onValueChange={(v: RecurrencePreset) => set({ preset: v })}
      >
        <SelectTrigger className="w-full rounded-xl border-pink-200 bg-white/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AnimatePresence initial={false}>
        {value.preset === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-pink-200 bg-gradient-to-br from-rose-50/80 to-fuchsia-50/60 p-4">
              {/* Repetir cada N unidad */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Repeat every</span>
                <Input
                  type="number"
                  min={1}
                  value={value.interval}
                  onChange={(e) => set({ interval: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-9 w-16 rounded-lg border-pink-200 text-center"
                />
                <Select
                  value={value.unit}
                  onValueChange={(v: RecurrenceUnit) => set({ unit: v })}
                >
                  <SelectTrigger className="h-9 w-32 rounded-lg border-pink-200 bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Días de la semana (solo unit=week) */}
              <AnimatePresence initial={false}>
                {value.unit === "week" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="mb-1.5 text-sm text-gray-600">Repeat on</p>
                    <div className="flex gap-1.5">
                      {WEEKDAYS.map((label, d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleWeekday(d)}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition",
                            value.weekdays.includes(d)
                              ? "bg-rose-500 text-white shadow"
                              : "bg-white text-gray-500 hover:bg-rose-100",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* End condition */}
              <div>
                <p className="mb-1.5 text-sm text-gray-600">Ends</p>
                <div className="space-y-2">
                  {(["never", "onDate", "after"] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="rec-end"
                        checked={value.end.mode === mode}
                        onChange={() => setEnd({ mode })}
                        className="accent-rose-500"
                      />
                      {mode === "never" && <span>Never</span>}
                      {mode === "onDate" && (
                        <span className="flex items-center gap-2">
                          On
                          <Input
                            type="date"
                            value={value.end.date}
                            min={startKey}
                            onChange={(e) => setEnd({ mode: "onDate", date: e.target.value })}
                            className="h-8 w-40 rounded-lg border-pink-200"
                          />
                        </span>
                      )}
                      {mode === "after" && (
                        <span className="flex items-center gap-2">
                          After
                          <Input
                            type="number"
                            min={1}
                            value={value.end.count}
                            onChange={(e) =>
                              setEnd({ mode: "after", count: Math.max(1, Number(e.target.value) || 1) })
                            }
                            className="h-8 w-16 rounded-lg border-pink-200 text-center"
                          />
                          times
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {value.preset !== "none" && (
        <p className="text-xs text-rose-500">🔁 {describeRecurrence(value, startKey)}</p>
      )}
    </div>
  )
}
