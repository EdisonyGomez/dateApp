/**
 * ───────────────────────────────────────────────
 *  Holidays engine (pure) — Colombia 🇨🇴 & USA 🇺🇸
 * ───────────────────────────────────────────────
 *  Holidays are COMPUTED per year, not hardcoded per date. That means
 *  Easter-based feasts (Meeus algorithm), Colombia's "Ley Emiliani"
 *  (move to next Monday) and USA's nth-weekday federal holidays all
 *  resolve correctly for any year.
 *
 *  Everything works on "YYYY-MM-DD" keys, timezone-safe.
 */

import { addDays } from "@/lib/date"

export type Country = "CO" | "US"

export interface Holiday {
  dateKey: string
  name: string
  description: string
  country: Country
  flag: string
}

/* ───────── helpers de fecha ───────── */

const pad = (n: number) => String(n).padStart(2, "0")
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const dowOf = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).getDay() // 0=Sun..6=Sat
}

/** n-ésimo día de semana del mes (weekday 0=Dom..6=Sáb). */
const nthWeekday = (year: number, month: number, weekday: number, n: number): string => {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const day = 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7
  return keyOf(year, month, day)
}

/** Último día de semana del mes. */
const lastWeekday = (year: number, month: number, weekday: number): string => {
  const lastDay = new Date(year, month, 0).getDate()
  const lastDow = new Date(year, month - 1, lastDay).getDay()
  const day = lastDay - ((lastDow - weekday + 7) % 7)
  return keyOf(year, month, day)
}

/** Ley Emiliani: si no cae lunes, se traslada al lunes siguiente. */
const emiliani = (key: string): string => {
  const dow = dowOf(key)
  if (dow === 1) return key
  return addDays(key, (1 - dow + 7) % 7)
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
const easterSunday = (year: number): string => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return keyOf(year, month, day)
}

/* ───────── festivos por país ───────── */

const usHolidays = (year: number): Holiday[] => {
  const flag = "🇺🇸"
  const h = (dateKey: string, name: string, description: string): Holiday => ({
    dateKey,
    name,
    description,
    country: "US",
    flag,
  })
  return [
    h(keyOf(year, 1, 1), "New Year's Day", "Marks the first day of the Gregorian calendar year."),
    h(nthWeekday(year, 1, 1, 3), "Martin Luther King Jr. Day", "Honors the civil rights leader Dr. Martin Luther King Jr."),
    h(nthWeekday(year, 2, 1, 3), "Presidents' Day", "Celebrates U.S. presidents, originally George Washington's birthday."),
    h(lastWeekday(year, 5, 1), "Memorial Day", "Honors the military personnel who died while serving."),
    h(keyOf(year, 6, 19), "Juneteenth", "Commemorates the end of slavery in the United States in 1865."),
    h(keyOf(year, 7, 4), "Independence Day", "Celebrates the Declaration of Independence in 1776."),
    h(nthWeekday(year, 9, 1, 1), "Labor Day", "Honors the American labor movement and its workers."),
    h(nthWeekday(year, 10, 1, 2), "Columbus Day", "Marks Columbus's arrival in the Americas in 1492."),
    h(keyOf(year, 11, 11), "Veterans Day", "Honors everyone who has served in the U.S. armed forces."),
    h(nthWeekday(year, 11, 4, 4), "Thanksgiving Day", "A day of gratitude and family gatherings, dating back to 1621."),
    h(keyOf(year, 12, 25), "Christmas Day", "Christian holiday celebrating the birth of Jesus."),
  ]
}

const coHolidays = (year: number): Holiday[] => {
  const flag = "🇨🇴"
  const easter = easterSunday(year)
  const h = (dateKey: string, name: string, description: string): Holiday => ({
    dateKey,
    name,
    description,
    country: "CO",
    flag,
  })
  return [
    h(keyOf(year, 1, 1), "New Year's Day", "Marks the first day of the year."),
    h(emiliani(keyOf(year, 1, 6)), "Epiphany", "The visit of the Three Kings to the baby Jesus."),
    h(emiliani(keyOf(year, 3, 19)), "Saint Joseph's Day", "Feast of Saint Joseph, the husband of Mary."),
    h(addDays(easter, -3), "Maundy Thursday", "Commemorates the Last Supper of Jesus."),
    h(addDays(easter, -2), "Good Friday", "Marks the crucifixion of Jesus."),
    h(keyOf(year, 5, 1), "Labor Day", "International Workers' Day."),
    h(addDays(easter, 43), "Ascension Day", "Celebrates the ascension of Jesus into heaven."),
    h(addDays(easter, 64), "Corpus Christi", "Honors the body of Christ in the Eucharist."),
    h(addDays(easter, 71), "Sacred Heart", "Devotion to the Sacred Heart of Jesus."),
    h(emiliani(keyOf(year, 6, 29)), "Saint Peter and Saint Paul", "Feast of the apostles Peter and Paul."),
    h(keyOf(year, 7, 20), "Independence Day", "Celebrates Colombia's declaration of independence in 1810."),
    h(keyOf(year, 8, 7), "Battle of Boyacá", "Marks the decisive 1819 battle that sealed independence."),
    h(emiliani(keyOf(year, 8, 15)), "Assumption of Mary", "Celebrates the Virgin Mary's assumption into heaven."),
    h(emiliani(keyOf(year, 10, 12)), "Columbus Day", "Commemorates cultural diversity and Columbus's arrival."),
    h(emiliani(keyOf(year, 11, 1)), "All Saints' Day", "Honors all the saints of the church."),
    h(emiliani(keyOf(year, 11, 11)), "Independence of Cartagena", "Celebrates Cartagena's independence in 1811."),
    h(keyOf(year, 12, 8), "Immaculate Conception", "Celebrates Mary's conception free from original sin."),
    h(keyOf(year, 12, 25), "Christmas Day", "Christian holiday celebrating the birth of Jesus."),
  ]
}

/** Todos los festivos (CO + US) de un año. */
export const holidaysForYear = (year: number): Holiday[] => [
  ...coHolidays(year),
  ...usHolidays(year),
]

/** Mapa dateKey → festivos, para pintar la grilla. */
export const holidaysByDateKey = (year: number): Map<string, Holiday[]> => {
  const map = new Map<string, Holiday[]>()
  for (const holiday of holidaysForYear(year)) {
    const arr = map.get(holiday.dateKey)
    if (arr) arr.push(holiday)
    else map.set(holiday.dateKey, [holiday])
  }
  return map
}
