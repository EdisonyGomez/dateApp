import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { todayKey } from "@/lib/date"
import { CATEGORIES, categoryOf, DEFAULT_CATEGORY_ID } from "@/lib/calendar/eventCategory"
import type { CategoryId } from "@/lib/calendar/eventCategory"
import type { NewPlanInput } from "@/hooks/useSharedPlans"

interface QuickAddProps {
  /** normalmente addPlan; crea el evento con defaults sensatos */
  onAdd: (input: NewPlanInput) => Promise<boolean>
  /** abre el formulario completo (fecha, hora, recurrencia, tarea, pareja) */
  onMore: () => void
}

/**
 * ───────────────────────────────────────────────
 *  QuickAdd — creación de un toque
 * ───────────────────────────────────────────────
 *  Camino rápido: título + categoría → evento de HOY, todo el día.
 *  Reutiliza addPlan (misma capa de datos, misma validación) — cero lógica nueva.
 *  Para algo más fino (hora, recurrencia, tarea) → "More options" abre PlanForm.
 */
export const QuickAdd: React.FC<QuickAddProps> = ({ onAdd, onMore }) => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY_ID)
  const [saving, setSaving] = useState(false)
  const open = title.trim().length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t || saving) return
    const cat = categoryOf(category)
    setSaving(true)
    const ok = await onAdd({
      title: t,
      description: "",
      date: todayKey(),
      end_date: null,
      time: null,
      end_time: null,
      all_day: true, // sin hora → todo el día, sin recordatorio a medianoche
      location: "",
      is_task: false,
      reminder_minutes: null,
      rrule: null,
      color: cat.color,
      category: cat.id,
      plan_type: "individual",
    })
    setSaving(false)
    if (ok) setTitle("")
  }

  return (
    <form onSubmit={submit} className="cal-glass overflow-hidden p-2">
      <div className="flex items-center gap-2">
        <Sparkles className="ml-2 h-4 w-4 shrink-0 text-rose-400" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick add for today…"
          aria-label="Quick add event title"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!open || saving}
          className="shrink-0 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 hover:from-rose-600 hover:to-pink-600 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* categorías + acceso al form completo: aparecen al empezar a escribir */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1 pt-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    title={c.label}
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition",
                      active ? "scale-105 shadow-sm" : "opacity-60 hover:opacity-100",
                    )}
                    style={{ backgroundColor: active ? c.color : c.soft, color: active ? "#fff" : c.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                )
              })}
              <button
                type="button"
                onClick={onMore}
                className="ml-auto shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-pink-50"
              >
                More options
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
