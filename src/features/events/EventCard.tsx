import { Link } from 'react-router-dom'
import { site } from '../../config/site'
import { formatEventDate } from '../../lib/dates'
import type { EventRow } from '../../lib/supabase'

/** Tarjeta de evento con portada; `coverUrl` es la URL firmada de la portada, si hay. */
export function EventCard({ event, coverUrl }: { event: EventRow; coverUrl?: string }) {
  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group block overflow-hidden rounded-lg border border-surface-2 bg-surface transition-colors hover:border-red"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-navy-dark">
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <img src={site.logo} alt="" className="h-24 w-24 opacity-40" />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h2 className="text-xl font-bold group-hover:text-red-hover">{event.title}</h2>
        <p className="text-sm text-steel first-letter:uppercase">{formatEventDate(event.starts_at)}</p>
        {event.location && <p className="text-sm text-muted">{event.location}</p>}
      </div>
    </Link>
  )
}
