import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../components/ui'
import { formatDay } from '../../lib/dates'
import { displayName } from '../../lib/supabase'
import type { SuggestionWithAuthor } from './api'

const statusLabel = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' } as const
const statusTone = { pending: 'neutral', approved: 'navy', rejected: 'red' } as const

/** Lista de sugerencias; `actions` permite al panel de líderes añadir botones por fila. */
export function SuggestionList({
  suggestions,
  actions,
}: {
  suggestions: SuggestionWithAuthor[]
  actions?: (s: SuggestionWithAuthor) => ReactNode
}) {
  return (
    <ul className="space-y-3">
      {suggestions.map((s) => (
        <li key={s.id}>
          <Card className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold">{s.title}</h3>
              <Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge>
            </div>
            {s.description && <p className="whitespace-pre-line text-steel">{s.description}</p>}
            <p className="text-sm text-muted">
              Propuesta por {displayName(s.author)}
              {s.tentative_date && <> · Fecha tentativa: {formatDay(s.tentative_date)}</>}
            </p>
            {s.status === 'rejected' && s.leader_note && (
              <p className="rounded-md border border-red-dark px-3 py-2 text-sm">
                <span className="font-semibold">Nota de los líderes:</span> {s.leader_note}
              </p>
            )}
            {s.status === 'approved' && s.event_id && (
              <Link to={`/eventos/${s.event_id}`} className="inline-block text-sm font-semibold text-steel underline hover:text-ink">
                Ver el evento
              </Link>
            )}
            {actions && <div className="flex flex-wrap gap-2 pt-1">{actions(s)}</div>}
          </Card>
        </li>
      ))}
    </ul>
  )
}
