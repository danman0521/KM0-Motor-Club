import { forecastableDate, useEventWeather } from './api'

/** Categoría visual a partir del código WMO, para elegir el ícono. */
function category(code: number): 'sol' | 'nubes' | 'lluvia' | 'nieve' | 'tormenta' {
  if (code <= 1) return 'sol'
  if (code === 95 || code === 96 || code === 99) return 'tormenta'
  if (code >= 71 && code <= 86 && code !== 80 && code !== 81 && code !== 82) return 'nieve'
  if (code >= 51) return 'lluvia'
  return 'nubes'
}

function WeatherGlyph({ code }: { code: number }) {
  const cat = category(code)
  const stroke = 'currentColor'
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {cat === 'sol' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {cat === 'nubes' && <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 18H7z" />}
      {cat === 'lluvia' && (
        <>
          <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 15H7z" />
          <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
        </>
      )}
      {cat === 'tormenta' && (
        <>
          <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 15H7z" />
          <path d="M12 15l-2 4h3l-2 4" />
        </>
      )}
      {cat === 'nieve' && (
        <>
          <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 15H7z" />
          <path d="M9 19h.01M12 20h.01M15 19h.01" />
        </>
      )}
    </svg>
  )
}

/** Chip con el pronóstico del clima para un evento próximo. No muestra nada si no aplica. */
export function WeatherForecast({ location, startsAt }: { location: string; startsAt: string }) {
  const weather = useEventWeather(location, startsAt)

  // No hay lugar, o el evento ya pasó / está fuera del rango de pronóstico
  if (!location.trim() || !forecastableDate(startsAt)) return null
  if (weather.isPending) return <span className="text-sm text-muted">Consultando el clima…</span>
  if (weather.isError || !weather.data) return null

  const w = weather.data
  return (
    <div className="inline-flex animate-fade-in items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-steel">
      <span className="text-silver">
        <WeatherGlyph code={w.code} />
      </span>
      <span>
        <span className="text-muted">Clima en {w.place}:</span> {w.tempMax}° / {w.tempMin}°
        {w.precipitation != null && <> · lluvia {w.precipitation}%</>} · {w.description}
      </span>
    </div>
  )
}
