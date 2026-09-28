/**
 * ───────────────────────────────────────────────
 *  useWeather — clima actual por geolocalización (Open-Meteo, sin API key)
 * ───────────────────────────────────────────────
 *  - Pide ubicación (una vez). Si el user rechaza → fallback por hora (día/noche).
 *  - Consulta Open-Meteo y mapea el weather_code a una WeatherKey.
 *  - Cachea en localStorage (30 min) para no re-pedir en cada mount.
 */

import { useEffect, useState } from "react"
import { WEATHER, codeToWeather, fallbackWeather, type WeatherKey } from "@/lib/calendar/weather"

export interface Weather {
  key: WeatherKey
  tempC: number | null
  label: string
  icon: string
  bg: string
  fg: string
  loading: boolean
}

interface Cache {
  key: WeatherKey
  tempC: number | null
  ts: number
}

const CACHE_KEY = "cd-weather-cache"
const TTL = 30 * 60 * 1000 // 30 min

const readCache = (): Cache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cache
    return Date.now() - c.ts < TTL ? c : null
  } catch {
    return null
  }
}
const writeCache = (key: WeatherKey, tempC: number | null) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, tempC, ts: Date.now() } satisfies Cache))
  } catch {
    /* private mode / bloqueado → sin cache, no rompe */
  }
}

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geolocation"))
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 30 * 60 * 1000,
    })
  })

export function useWeather(): Weather {
  const cached = readCache()
  const [key, setKey] = useState<WeatherKey>(cached?.key ?? fallbackWeather())
  const [tempC, setTempC] = useState<number | null>(cached?.tempC ?? null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let alive = true
    if (cached) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const pos = await getPosition()
        const { latitude, longitude } = pos.coords
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,weather_code,is_day&timezone=auto`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`open-meteo ${res.status}`)
        const data = await res.json()
        const cur = data.current ?? {}
        const t: number | null = typeof cur.temperature_2m === "number" ? Math.round(cur.temperature_2m) : null
        const k = codeToWeather(Number(cur.weather_code), cur.is_day === 1, t)
        if (!alive) return
        setKey(k)
        setTempC(t)
        writeCache(k, t)
      } catch {
        // sin permiso / sin red → fallback por hora, no rompe la UI
        if (!alive) return
        setKey(fallbackWeather())
        setTempC(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = WEATHER[key]
  return { key, tempC, label: style.label, icon: style.icon, bg: style.bg, fg: style.fg, loading }
}
