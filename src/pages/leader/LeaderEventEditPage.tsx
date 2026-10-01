import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { EventForm } from '../../features/events/EventForm'
import { PhotoManager } from '../../features/events/PhotoManager'
import { VideoManager } from '../../features/events/VideoManager'
import { useEvent, useSaveEvent, type EventInput } from '../../features/events/api'
import { useApproveSuggestionAsEvent, useSuggestions } from '../../features/suggestions/api'
import { displayName } from '../../lib/supabase'

/** Crea o edita un evento. Con `?sugerencia=<id>` aprueba esa sugerencia al crear. */
export function LeaderEventEditPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const suggestionId = id ? null : params.get('sugerencia')
  const navigate = useNavigate()

  const event = useEvent(id)
  const suggestions = useSuggestions()
  const saveEvent = useSaveEvent()
  const approve = useApproveSuggestionAsEvent()
  const [saved, setSaved] = useState(false)

  const back = (
    <Link to="/lider/eventos" className="text-sm text-steel hover:text-ink">
      ← Eventos
    </Link>
  )

  // --- Evento nuevo (opcionalmente desde una sugerencia) ---
  if (!id) {
    const suggestion = suggestionId ? suggestions.data?.find((s) => s.id === suggestionId) : undefined
    if (suggestionId && suggestions.isPending) return <Spinner />
    if (suggestionId && (!suggestion || suggestion.status !== 'pending')) {
      return <EmptyState>Esta sugerencia no existe o ya fue revisada.</EmptyState>
    }

    const initial: Partial<EventInput> | undefined = suggestion && {
      title: suggestion.title,
      description: suggestion.description,
      // Fecha tentativa a las 8:00 como punto de partida
      starts_at: suggestion.tentative_date ? new Date(`${suggestion.tentative_date}T08:00`).toISOString() : undefined,
    }

    async function create(input: EventInput) {
      const newId = suggestion
        ? await approve.mutateAsync({
            suggestionId: suggestion.id,
            title: input.title,
            description: input.description,
            location: input.location,
            starts_at: input.starts_at,
          })
        : await saveEvent.mutateAsync({ input })
      navigate(`/lider/eventos/${newId}`, { replace: true })
    }

    return (
      <div className="space-y-4">
        {back}
        <h2 className="text-2xl font-bold">{suggestion ? 'Aprobar sugerencia' : 'Nuevo evento'}</h2>
        {suggestion && (
          <p className="rounded-md border border-navy bg-navy-dark px-4 py-3 text-sm text-steel">
            Sugerencia de {displayName(suggestion.author)}. Ajusta los datos y elige fecha y hora; al guardar se crea el
            evento y la sugerencia queda aprobada.
          </p>
        )}
        <Card>
          <EventForm
            key={suggestion?.id ?? 'nuevo'}
            initial={initial}
            showChronicle={false}
            submitLabel={suggestion ? 'Aprobar y crear evento' : 'Crear evento'}
            onSubmit={create}
          />
        </Card>
        <p className="text-sm text-muted">Después de crearlo podrás añadir fotos, videos y la crónica.</p>
      </div>
    )
  }

  // --- Evento existente ---
  if (event.isPending) return <Spinner />
  if (event.isError) return <ErrorNote message="No se pudo cargar el evento." onRetry={() => event.refetch()} />
  if (!event.data) return <EmptyState>Este evento no existe o fue eliminado.</EmptyState>

  const current = event.data

  async function update(input: EventInput) {
    setSaved(false)
    await saveEvent.mutateAsync({ id: current.id, input })
    setSaved(true)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {back}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Editar evento</h2>
          <Link to={`/eventos/${current.id}`} className="text-sm font-semibold text-steel underline hover:text-ink">
            Ver como miembro
          </Link>
        </div>
        {saved && <p className="rounded-md border border-navy bg-navy-dark px-4 py-3 text-sm text-steel">Cambios guardados.</p>}
        <Card>
          <EventForm key={current.id} initial={current} submitLabel="Guardar cambios" onSubmit={update} />
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Fotos</h2>
        <PhotoManager event={current} />
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Videos</h2>
        <VideoManager eventId={current.id} />
      </section>
    </div>
  )
}
