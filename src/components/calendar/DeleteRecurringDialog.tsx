import type React from "react"
import { motion } from "framer-motion"
import { Circle, ChevronsRight, Layers, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export type DeleteMode = "this" | "future" | "all"

interface DeleteRecurringDialogProps {
  open: boolean
  title?: string
  onChoice: (mode: DeleteMode) => void
  onCancel: () => void
}

const OPTIONS: { mode: DeleteMode; label: string; desc: string; icon: React.ElementType }[] = [
  { mode: "this", label: "This event", desc: "Delete only this occurrence", icon: Circle },
  { mode: "future", label: "This and following events", desc: "Delete this one and all future ones", icon: ChevronsRight },
  { mode: "all", label: "All events", desc: "Delete the entire series", icon: Layers },
]

/** Diálogo estilo Google para borrar un evento recurrente. */
export const DeleteRecurringDialog: React.FC<DeleteRecurringDialogProps> = ({
  open,
  title,
  onChoice,
  onCancel,
}) => (
  <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <DialogContent className="rounded-3xl sm:max-w-sm">
      <DialogHeader>
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-red-50"
        >
          <Trash2 className="h-6 w-6 text-red-500" />
        </motion.div>
        <DialogTitle>Delete recurring event</DialogTitle>
        <DialogDescription>
          {title ? `“${title}” repeats. What would you like to delete?` : "This event repeats. What would you like to delete?"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {OPTIONS.map((o, i) => (
          <motion.button
            key={o.mode}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoice(o.mode)}
            className="flex w-full items-center gap-3 rounded-2xl border border-pink-100 p-3 text-left transition-colors hover:border-rose-300 hover:bg-rose-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-100 text-rose-500">
              <o.icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-semibold text-gray-800">{o.label}</span>
              <span className="block text-xs text-gray-500">{o.desc}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
)
