/**
 * ───────────────────────────────────────────────
 *  weather — config de climas + mapeo WMO (Open-Meteo)
 * ───────────────────────────────────────────────
 *  Fuente de verdad del set de climas del header reactivo.
 *  El código WMO de Open-Meteo se mapea a una de estas claves; cada clave
 *  define el fondo (gradiente), el color de texto legible y el chip.
 */

export type WeatherKey = "clear" | "hot" | "rain" | "storm" | "clouds" | "snow" | "night" | "fog"

export interface WeatherStyle {
  /** fondo del header (CSS gradient) */
  bg: string
  /** color de texto legible sobre ese fondo */
  fg: string
  /** etiqueta corta en español */
  label: string
  /** emoji para el chip */
  icon: string
}

export const WEATHER: Record<WeatherKey, WeatherStyle> = {
  clear:  { bg: "linear-gradient(150deg,#fef9c3,#fed7aa,#fecaca)", fg: "#7c2d12", label: "Soleado",   icon: "☀️" },
  hot:    { bg: "linear-gradient(150deg,#fca5a5,#fb923c,#ef4444)", fg: "#ffffff", label: "¡Calor!",   icon: "🥵" },
  rain:   { bg: "linear-gradient(150deg,#93c5fd,#60a5fa,#64748b)", fg: "#0f2740", label: "Lluvia",    icon: "🌧️" },
  storm:  { bg: "linear-gradient(150deg,#475569,#334155,#1e293b)", fg: "#e2e8f0", label: "Tormenta",  icon: "⛈️" },
  clouds: { bg: "linear-gradient(150deg,#e0e7ff,#cbd5e1,#eef2ff)", fg: "#334155", label: "Nublado",   icon: "☁️" },
  snow:   { bg: "linear-gradient(150deg,#e0f2fe,#dbeafe,#f8fafc)", fg: "#1e3a5f", label: "Nieve",     icon: "❄️" },
  night:  { bg: "linear-gradient(150deg,#3730a3,#1e1b4b,#0f172a)", fg: "#e9d5ff", label: "Despejado", icon: "🌙" },
  fog:    { bg: "linear-gradient(150deg,#cbd5e1,#e2e8f0,#cbd5e1)", fg: "#334155", label: "Niebla",    icon: "🌫️" },
}

/** Umbral de "sol terrible" (°C). */
const HOT_THRESHOLD = 32

/**
 * Mapea el código WMO de Open-Meteo a una clave de clima.
 * https://open-meteo.com/en/docs (weather_code)
 */
export function codeToWeather(code: number, isDay: boolean, tempC: number | null): WeatherKey {
  if ([95, 96, 99].includes(code)) return "storm"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow"
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain"
  if ([45, 48].includes(code)) return "fog"
  if ([2, 3].includes(code)) return "clouds"
  // 0 (despejado) o 1 (mayormente despejado)
  if (!isDay) return "night"
  if (tempC !== null && tempC >= HOT_THRESHOLD) return "hot"
  return "clear"
}

/** Fallback sin ubicación: tema por hora local (día/noche). */
export function fallbackWeather(date = new Date()): WeatherKey {
  const h = date.getHours()
  return h < 6 || h >= 19 ? "night" : "clear"
}
