import type React from "react"
import { cn } from "@/lib/utils"
import { CATEGORY_BY_ID, type CategoryId } from "@/lib/calendar/eventCategory"

/**
 * ───────────────────────────────────────────────
 *  CategoryBadge / CategoryTag
 * ───────────────────────────────────────────────
 *  Átomos presentacionales para mostrar la categoría de un evento.
 *  La fuente de verdad (color/icono/label) vive en eventCategory.ts.
 *
 *   - CategoryBadge: cuadradito con el icono (marcador principal).
 *   - CategoryTag:   pill con icono + label (filas de metadatos / leyenda).
 */

interface BadgeProps {
  category: CategoryId
  size?: "sm" | "md"
  className?: string
}

/** Icono de la categoría dentro de un cuadrado con su tinte. */
export const CategoryBadge: React.FC<BadgeProps> = ({ category, size = "md", className }) => {
  const cat = CATEGORY_BY_ID[category]
  const Icon = cat.icon
  const box = size === "sm" ? "h-6 w-6 rounded-lg" : "h-8 w-8 rounded-xl"
  const glyph = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  return (
    <span
      className={cn("grid shrink-0 place-items-center", box, className)}
      style={{ backgroundColor: cat.soft, color: cat.color }}
      title={cat.label}
      aria-label={cat.label}
    >
      <Icon className={glyph} />
    </span>
  )
}

/** Solo el icono de la categoría (hereda color; ideal sobre pills de color sólido). */
export const CategoryGlyph: React.FC<{ category: CategoryId; className?: string }> = ({
  category,
  className,
}) => {
  const Icon = CATEGORY_BY_ID[category].icon
  return <Icon className={className} aria-label={CATEGORY_BY_ID[category].label} />
}

interface TagProps {
  category: CategoryId
  className?: string
}

/** Pill compacto icono + label, para filas de metadatos. */
export const CategoryTag: React.FC<TagProps> = ({ category, className }) => {
  const cat = CATEGORY_BY_ID[category]
  const Icon = cat.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        className,
      )}
      style={{ backgroundColor: cat.soft, color: cat.color }}
    >
      <Icon className="h-3 w-3" />
      {cat.label}
    </span>
  )
}
