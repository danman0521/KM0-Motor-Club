import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { useDeleteEvent, useEvents } from '../../features/events/api'
import { formatEventDate, isPast } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import type { EventRow } from '../../lib/supabase'

export function LeaderEventsPage() {
  const events = useEvents()
  const deleteEvent = useDeleteEvent()
  const [actionError, setActionError] = useState('')

  async function remove(event: EventRow) {
    if (!window.confirm(`¿Borrar "${event.title}" con sus fotos y videos? No se puede deshacer.`)) return
    setActionError('')
    try {
      await deleteEvent.mutateAsync(event.id)
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Eventos</h2>
        <ButtonLink to="/lider/eventos/nuevo">Nuevo evento</ButtonLink>
      </div>

      {actionError && <ErrorNote message={actionError} />}
      {events.isPending && <Spinner />}
      {events.isError && <ErrorNote message="No se pudieron cargar los eventos." onRetry={() => events.refetch()} />}
      {events.isSuccess && events.data.length === 0 && <EmptyState>Aún no hay eventos. Crea el primero.</EmptyState>}

      <ul className="space-y-3">
        {events.data?.map((e) => {
          const past = isPast(e.starts_at)
          return (
            <li key={e.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/eventos/${e.id}`} className="text-lg font-semibold hover:text-red-hover">
                      {e.title}
                    </Link>
                    <Badge tone={past ? 'neutral' : 'navy'}>{past ? 'Realizado' : 'Próximo'}</Badge>
                    {past && !e.chronicle && <Badge tone="cream">Falta la crónica</Badge>}
                  </div>
                  <p className="text-sm text-steel first-letter:uppercase">
                    {formatEventDate(e.starts_at)}
                    {e.location && <span className="text-muted"> · {e.location}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ButtonLink variant="ghost" to={`/lider/eventos/${e.id}`}>
                    Editar
                  </ButtonLink>
                  <Button variant="danger" disabled={deleteEvent.isPending} onClick={() => remove(e)}>
                    Borrar
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
