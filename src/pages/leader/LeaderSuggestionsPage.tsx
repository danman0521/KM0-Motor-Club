import { useState, type FormEvent } from 'react'
import { Button, ButtonLink, EmptyState, ErrorNote, Field, Modal, Spinner } from '../../components/ui'
import { SuggestionList } from '../../features/suggestions/SuggestionList'
import { useRejectSuggestion, useSuggestions, type SuggestionWithAuthor } from '../../features/suggestions/api'
import { friendlyError } from '../../lib/errors'

export function LeaderSuggestionsPage() {
  const suggestions = useSuggestions()
  const reject = useRejectSuggestion()
  const [rejecting, setRejecting] = useState<SuggestionWithAuthor | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  function openReject(s: SuggestionWithAuthor) {
    setRejecting(s)
    setNote('')
    setError('')
  }

  async function confirmReject(e: FormEvent) {
    e.preventDefault()
    if (!rejecting) return
    setError('')
    try {
      await reject.mutateAsync({ id: rejecting.id, note })
      setRejecting(null)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  if (suggestions.isPending) return <Spinner />
  if (suggestions.isError) {
    return <ErrorNote message="No se pudieron cargar las sugerencias." onRetry={() => suggestions.refetch()} />
  }

  const pending = suggestions.data.filter((s) => s.status === 'pending')
  const reviewed = suggestions.data.filter((s) => s.status !== 'pending')

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-2xl font-bold">Por revisar</h2>
        {pending.length === 0 ? (
          <EmptyState>No hay sugerencias por revisar.</EmptyState>
        ) : (
          <SuggestionList
            suggestions={pending}
            actions={(s) => (
              <>
                <ButtonLink to={`/lider/eventos/nuevo?sugerencia=${s.id}`}>Aprobar…</ButtonLink>
                <Button variant="danger" onClick={() => openReject(s)}>
                  Rechazar…
                </Button>
              </>
            )}
          />
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Ya revisadas</h2>
          <SuggestionList suggestions={reviewed} />
        </section>
      )}

      {rejecting && (
        <Modal title="Rechazar sugerencia" onClose={() => setRejecting(null)}>
          <form onSubmit={confirmReject} className="space-y-4">
            <p className="text-steel">«{rejecting.title}»</p>
            {error && <ErrorNote message={error} />}
            <Field label="Nota para el grupo (opcional)" hint="Todos los miembros verán esta nota.">
              {(p) => <textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejecting(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="danger" disabled={reject.isPending}>
                {reject.isPending ? 'Rechazando…' : 'Rechazar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
