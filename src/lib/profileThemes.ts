/**
 * ───────────────────────────────────────────────
 *  Temas de perfil por persona
 * ───────────────────────────────────────────────
 *  Cada persona elige su tema (profile_theme). El contenido vive sobre
 *  tarjetas "glass" para que el texto sea legible en cualquier fondo;
 *  el tema pinta el fondo, los acentos, los chips, el botón y el
 *  ambiente 3D (colores/motivos de partículas).
 */

export type ProfileTheme = "china" | "colombia" | "default"

export interface ThemeTokens {
  id: ProfileTheme
  label: string
  flag: string
  /** fondo inmersivo del perfil */
  pageBg: string
  /** patrón/overlay sutil sobre el fondo */
  overlay: string
  /** gradiente de título (bg-clip-text) */
  headline: string
  /** gradiente de las cápsulas de ícono */
  iconBg: string
  /** chip de lista (modo vista) */
  chip: string
  /** botón principal */
  button: string
  /** color de ring/focus (tailwind) */
  ring: string
  /** acento de texto */
  accentText: string
  /** motivos emoji para el ambiente */
  motifs: string[]
  /** colores (hex) para las partículas 3D */
  particleColors: string[]
}

export const THEMES: Record<ProfileTheme, ThemeTokens> = {
  china: {
    id: "china",
    label: "China",
    flag: "🇨🇳",
    pageBg: "bg-gradient-to-br from-[#7a1220] via-[#a4161a] to-[#3d0a10]",
    overlay:
      "radial-gradient(circle at 20% 20%, rgba(255,215,0,0.12), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,215,0,0.08), transparent 45%)",
    headline: "from-amber-200 via-yellow-300 to-amber-400",
    iconBg: "from-red-500 to-amber-500",
    chip: "bg-amber-400/15 text-amber-100 border-amber-300/40",
    button: "from-amber-400 to-red-500 hover:from-amber-500 hover:to-red-600 text-red-950",
    ring: "focus-visible:ring-amber-400",
    accentText: "text-amber-300",
    motifs: ["🏮", "🐉", "🧧", "🀄", "✨"],
    particleColors: ["#ffd700", "#ff4d4d", "#ffec99", "#e63946"],
  },
  colombia: {
    id: "colombia",
    label: "Colombia",
    flag: "🇨🇴",
    pageBg: "bg-gradient-to-br from-[#f2c200] via-[#1a659e] to-[#7a1220]",
    overlay:
      "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.14), transparent 40%), radial-gradient(circle at 85% 80%, rgba(0,56,147,0.18), transparent 45%)",
    headline: "from-yellow-200 via-amber-300 to-yellow-400",
    iconBg: "from-yellow-400 to-blue-600",
    chip: "bg-yellow-300/20 text-yellow-50 border-yellow-200/40",
    button: "from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-blue-950",
    ring: "focus-visible:ring-yellow-400",
    accentText: "text-yellow-200",
    motifs: ["🇨🇴", "☕", "🏔️", "🌴", "⚽"],
    particleColors: ["#FCD116", "#003893", "#CE1126", "#ffffff"],
  },
  default: {
    id: "default",
    label: "Romántico",
    flag: "💕",
    pageBg: "bg-gradient-to-br from-pink-100 via-white to-rose-100",
    overlay:
      "radial-gradient(circle at 20% 20%, rgba(244,63,94,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.08), transparent 45%)",
    headline: "from-pink-600 via-rose-500 to-purple-600",
    iconBg: "from-pink-400 to-rose-500",
    chip: "bg-pink-100 text-pink-800 border-pink-200",
    button: "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white",
    ring: "focus-visible:ring-pink-400",
    accentText: "text-rose-500",
    motifs: ["💕", "🌸", "✨", "💖", "🦋"],
    particleColors: ["#fb7185", "#f472b6", "#f9a8d4", "#ffffff"],
  },
}

export const getTheme = (t?: string | null): ThemeTokens =>
  THEMES[(t as ProfileTheme) ?? "default"] ?? THEMES.default

export const SELECTABLE_THEMES: ThemeTokens[] = [THEMES.china, THEMES.colombia, THEMES.default]
