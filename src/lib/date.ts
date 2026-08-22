/**
 * ───────────────────────────────────────────────
 *  Utilidades de fecha timezone-safe
 * ───────────────────────────────────────────────
 *  Regla de oro: para fechas "de calendario" (sin hora) NUNCA usar
 *  new Date("YYYY-MM-DD") porque se interpreta como UTC medianoche y
 *  corre el día en zonas con offset negativo. Trabajamos con claves
 *  string "YYYY-MM-DD" y construimos Date desde sus partes.
 */

/** Normaliza cualquier fecha (date puro o ISO con hora/zona) a "YYYY-MM-DD". */
export const toDateKey = (value: string | null | undefined): string => {
  if (!value) return ""
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return keyFromDate(d)
}

/** Clave "YYYY-MM-DD" desde un Date (en su zona local). */
export const keyFromDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Clave de hoy en la zona local del usuario. */
export const todayKey = (): string => keyFromDate(new Date())

/** Suma (o resta) días a una clave y devuelve otra clave, sin corrimiento. */
export const addDays = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number)
  return keyFromDate(new Date(y, m - 1, d + days))
}

/** Diferencia en días entre dos claves (b - a). */
export const daysBetween = (a: string, b: string): number => {
  const [ay, am, ad] = a.split("-").map(Number)
  const [by, bm, bd] = b.split("-").map(Number)
  const ms = new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()
  return Math.round(ms / 86_400_000)
}

/** Formats a key to readable text (en-US) building a local Date. */
export const formatKey = (
  key: string,
  opts: Intl.DateTimeFormatOptions = {},
  locale = "en-US",
): string => {
  const [y, m, d] = key.split("-").map(Number)
  if (!y) return ""
  return new Date(y, m - 1, d).toLocaleDateString(locale, opts)
}
