import type React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

/* ───────── Chips: agregar (Enter/coma) y quitar por ítem ───────── */

interface ChipListEditorProps {
  items: string[]
  editable: boolean
  onChange?: (next: string[]) => void
  placeholder?: string
  chipClass?: string
  ring?: string
}

export const ChipListEditor: React.FC<ChipListEditorProps> = ({
  items,
  editable,
  onChange,
  placeholder = "Agregar…",
  chipClass,
  ring,
}) => {
  const [draft, setDraft] = useState("")

  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (!items.includes(v)) onChange?.([...items, v])
    setDraft("")
  }
  const remove = (i: number) => onChange?.(items.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <motion.span
            key={`${it}-${i}`}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium", chipClass)}
          >
            {it}
            {editable && (
              <button type="button" onClick={() => remove(i)} className="opacity-70 transition hover:opacity-100" aria-label={`Quitar ${it}`}>
                <X className="h-3 w-3" />
              </button>
            )}
          </motion.span>
        ))}
      </AnimatePresence>

      {editable ? (
        <div className="inline-flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                add()
              }
            }}
            onBlur={add}
            placeholder={placeholder}
            className={cn(
              "min-w-[8rem] rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm text-white outline-none placeholder:text-white/45 focus-visible:ring-2",
              ring,
            )}
          />
          <button type="button" onClick={add} className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Agregar">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        items.length === 0 && <span className="text-sm text-white/50">—</span>
      )}
    </div>
  )
}

/* ───────── Texto / fecha inline ───────── */

interface InlineTextProps {
  value?: string
  editable: boolean
  onChange?: (v: string) => void
  placeholder?: string
  type?: "text" | "date"
  ring?: string
  className?: string
}

export const InlineText: React.FC<InlineTextProps> = ({ value, editable, onChange, placeholder, type = "text", ring, className }) =>
  editable ? (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/40 focus-visible:ring-2",
        ring,
        className,
      )}
    />
  ) : (
    <p className={cn("text-white", className)}>{value || "—"}</p>
  )

interface InlineTextareaProps {
  value?: string
  editable: boolean
  onChange?: (v: string) => void
  placeholder?: string
  ring?: string
}

export const InlineTextarea: React.FC<InlineTextareaProps> = ({ value, editable, onChange, placeholder, ring }) =>
  editable ? (
    <textarea
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "min-h-[110px] w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/40 focus-visible:ring-2",
        ring,
      )}
    />
  ) : (
    <p className="whitespace-pre-wrap text-white/90">{value || "—"}</p>
  )
