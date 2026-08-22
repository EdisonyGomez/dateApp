import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Clock,
  Bell,
  MapPin,
  Users,
  User,
  ListTodo,
  CalendarHeart,
  Save,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { todayKey, toDateKey } from "@/lib/date"
import { configToRRule, defaultRecurrence } from "@/lib/calendar/recurrence"
import { RecurrenceField } from "./RecurrenceField"
import type { NewPlanInput } from "@/hooks/useSharedPlans"

interface PlanFormProps {
  onSubmit: (input: NewPlanInput) => Promise<boolean>
  onCancel: () => void
}

const REMINDER_OPTIONS = [
  { label: "No reminder", value: "none" },
  { label: "At time of event", value: "0" },
  { label: "10 minutes before", value: "10" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before", value: "60" },
  { label: "1 day before", value: "1440" },
]

const EVENT_COLORS = [
  { label: "Rose", value: "#f43f5e" },
  { label: "Peach", value: "#fb7185" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
]

/** Control segmentado tipo pill (Evento/Tarea, Individual/Juntos). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-flow-col rounded-2xl bg-pink-100/60 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={cn("relative z-10 flex items-center gap-1.5", active ? "text-rose-600" : "text-gray-500")}>
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export const PlanForm: React.FC<PlanFormProps> = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: todayKey(),
    end_date: "",
    time: "",
    end_time: "",
    location: "",
    is_task: false,
    all_day: false,
    reminder: "none",
    color: EVENT_COLORS[0].value,
    plan_type: "individual" as "individual" | "together",
  })
  const [recur, setRecur] = useState(defaultRecurrence())
  const [saving, setSaving] = useState(false)

  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }))
  const repeating = recur.preset !== "none"

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) {
      toast.error("Please add at least a title and a date")
      return
    }
    if (!repeating && form.end_date && toDateKey(form.end_date) < toDateKey(form.date)) {
      toast.error("The end date can't be before the start")
      return
    }

    const time = form.all_day ? null : form.time || null
    const input: NewPlanInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      end_date: repeating ? null : form.end_date || null,
      time,
      end_time: form.all_day ? null : form.end_time || null,
      all_day: form.all_day,
      location: form.location.trim(),
      is_task: form.is_task,
      reminder_minutes: form.reminder === "none" ? null : Number(form.reminder),
      rrule: configToRRule(recur, form.date, time),
      color: form.color,
      plan_type: form.plan_type,
    }

    setSaving(true)
    const ok = await onSubmit(input)
    setSaving(false)
    if (!ok) return
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <CalendarHeart className="h-7 w-7 text-rose-500" />
          {form.is_task ? "New task" : "New plan"}
        </h3>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl text-gray-500 hover:bg-pink-50"
        >
          Cancel
        </Button>
      </div>

      {/* Event / Task */}
      <Segmented
        value={form.is_task ? "task" : "event"}
        onChange={(v) => set({ is_task: v === "task" })}
        options={[
          { value: "event", label: "Event", icon: <CalendarDays className="h-4 w-4" /> },
          { value: "task", label: "Task", icon: <ListTodo className="h-4 w-4" /> },
        ]}
      />

      <div className="space-y-5 rounded-3xl border border-pink-100 bg-white/60 p-5 shadow-sm backdrop-blur-sm">
        {/* Título */}
        <Input
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={form.is_task ? "What needs to be done?" : "Plan title…"}
          className="rounded-xl border-pink-200 text-lg font-medium placeholder:font-normal focus-visible:ring-rose-400"
        />

        {/* All day */}
        <div className="flex items-center justify-between rounded-xl bg-pink-50/70 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Clock className="h-4 w-4 text-rose-400" />
            All day
          </span>
          <Switch checked={form.all_day} onCheckedChange={(v) => set({ all_day: v })} />
        </div>

        {/* Dates / times */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start *">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              className="rounded-xl border-pink-200"
            />
          </Field>
          {!form.all_day && (
            <Field label="Time">
              <Input
                type="time"
                value={form.time}
                onChange={(e) => set({ time: e.target.value })}
                className="rounded-xl border-pink-200"
              />
            </Field>
          )}
          {!repeating && (
            <Field label="End (optional)">
              <Input
                type="date"
                value={form.end_date}
                min={form.date}
                onChange={(e) => set({ end_date: e.target.value })}
                className="rounded-xl border-pink-200"
              />
            </Field>
          )}
          {!form.all_day && (
            <Field label="End time">
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => set({ end_time: e.target.value })}
                className="rounded-xl border-pink-200"
              />
            </Field>
          )}
        </div>

        {/* Recurrencia */}
        <RecurrenceField startKey={form.date} value={recur} onChange={setRecur} />

        {/* Recordatorio */}
        <Field
          label={
            <span className="flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-amber-500" />
              Reminder
            </span>
          }
        >
          <Select value={form.reminder} onValueChange={(v) => set({ reminder: v })}>
            <SelectTrigger className="rounded-xl border-pink-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Color */}
        <Field label="Color label">
          <div className="flex gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set({ color: c.value })}
                aria-label={c.label}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition hover:scale-110",
                  form.color === c.value && "ring-2 ring-offset-2 ring-gray-400",
                )}
                style={{ backgroundColor: c.value }}
              >
                {form.color === c.value && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </Field>

        {/* Ubicación */}
        <Field
          label={
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-rose-400" />
              Location
            </span>
          }
        >
          <Input
            value={form.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="Restaurant, home, park…"
            className="rounded-xl border-pink-200"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Details…"
            className="min-h-[70px] rounded-xl border-pink-200"
          />
        </Field>

        {/* Who */}
        <Field label="Who's it for?">
          <Segmented
            value={form.plan_type}
            onChange={(v) => set({ plan_type: v })}
            options={[
              { value: "individual", label: "Just me", icon: <User className="h-4 w-4" /> },
              { value: "together", label: "Together", icon: <Users className="h-4 w-4" /> },
            ]}
          />
        </Field>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-6 text-base font-semibold shadow-lg transition-all hover:from-rose-600 hover:to-pink-600 hover:shadow-xl active:scale-[0.99]"
      >
        <Save className="mr-2 h-5 w-5" />
        {saving ? "Saving…" : form.is_task ? "Save task" : "Save plan"}
      </Button>
    </motion.div>
  )
}

/** Campo con label, para no repetir markup. */
const Field: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
    {children}
  </div>
)
