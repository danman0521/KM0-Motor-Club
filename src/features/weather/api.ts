import { useQuery } from '@tanstack/react-query'

// Pronóstico del clima para la fecha y el lugar de un evento, usando Open-Meteo
// (gratis y sin clave). La geocodificación convierte el nombre del lugar en
// coordenadas y luego se pide el pronóstico diario de ese día.

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

/** Open-Meteo entrega pronóstico hasta 16 días hacia adelante. */
const MAX_FORECAST_DAYS = 16

export type EventForecast = {
  place: string
  tempMax: number
  tempMin: number
  /** Probabilidad de lluvia (0-100) o null si no viene */
  precipitation: number | null
  code: number
  description: string
}

/** Fecha local en formato YYYY-MM-DD. */
function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Devuelve la fecha (YYYY-MM-DD) para pedir el pronóstico, o null si el evento
 * ya pasó o cae fuera del rango de pronóstico (más de 16 días).
 */
export function forecastableDate(startsAt: string, now: Date = new Date()): string | null {
  const event = new Date(startsAt)
  if (Number.isNaN(event.getTime())) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(event.getFullYear(), event.getMonth(), event.getDate())
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0 || diffDays > MAX_FORECAST_DAYS) return null
  return toYmd(day)
}

/** Texto en español para el código de clima WMO de Open-Meteo. */
export function weatherText(code: number): string {
  if (code === 0) return 'Despejado'
  if (code === 1) return 'Mayormente despejado'
  if (code === 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code === 45 || code === 48) return 'Niebla'
  if (code >= 51 && code <= 55) return 'Llovizna'
  if (code === 56 || code === 57) return 'Llovizna helada'
  if (code >= 61 && code <= 65) return 'Lluvia'
  if (code === 66 || code === 67) return 'Lluvia helada'
  if (code >= 71 && code <= 75) return 'Nieve'
  if (code === 77) return 'Granos de nieve'
  if (code >= 80 && code <= 82) return 'Chubascos'
  if (code === 85 || code === 86) return 'Chubascos de nieve'
  if (code === 95) return 'Tormenta'
  if (code === 96 || code === 99) return 'Tormenta con granizo'
  return 'Sin datos'
}

async function fetchForecast(location: string, date: string): Promise<EventForecast | null> {
  const geoUrl = `${GEOCODE_URL}?name=${encodeURIComponent(location)}&count=1&language=es&format=json`
  const geo = await fetch(geoUrl).then((r) => r.json())
  const place = geo?.results?.[0]
  if (!place) return null

  const url =
    `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=auto&start_date=${date}&end_date=${date}`
  const data = await fetch(url).then((r) => r.json())
  const daily = data?.daily
  if (!daily?.time?.length) return null

  const code = daily.weather_code[0] as number
  return {
    place: place.name as string,
    tempMax: Math.round(daily.temperature_2m_max[0]),
    tempMin: Math.round(daily.temperature_2m_min[0]),
    precipitation: daily.precipitation_probability_max?.[0] ?? null,
    code,
    description: weatherText(code),
  }
}

/** Pronóstico del clima para un evento; inactivo si no hay lugar o cae fuera de rango. */
export function useEventWeather(location: string, startsAt: string) {
  const date = forecastableDate(startsAt)
  return useQuery({
    queryKey: ['weather', location, date],
    enabled: Boolean(location.trim()) && date !== null,
    staleTime: 1000 * 60 * 60,
    retry: false,
    queryFn: () => fetchForecast(location, date!),
  })
}
