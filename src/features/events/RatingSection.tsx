import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ErrorNote, Spinner } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { RatingSummary, StarRating } from './StarRating'
import { summarizeRatings, useRatings, useSetRating } from './community'

/** Calificación de un evento realizado: promedio del grupo y la nota propia. */
export function RatingSection({ eventId }: { eventId: string }) {
  const { profile } = useAuth()
  const ratings = useRatings(eventId)
  const setRating = useSetRating(eventId)
  const [error, setError] = useState('')

  const mine = ratings.data?.find((r) => r.profile_id === profile?.id)?.stars ?? null
  const summary = summarizeRatings((ratings.data ?? []).map((r) => r.stars))

  async function rate(stars: number) {
    setError('')
    try {
      await setRating.mutateAsync(stars)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Calificación</h2>
      {ratings.isPending && <Spinner label="Cargando calificaciones…" />}
      {ratings.isError && <ErrorNote message="No se pudieron cargar las calificaciones." onRetry={() => ratings.refetch()} />}
      {ratings.isSuccess && (
        <div className="space-y-3">
          {summary.count > 0 ? (
            <RatingSummary average={summary.average} count={summary.count} />
          ) : (
            <p className="text-sm text-muted">Aún nadie ha calificado este evento.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={mine} onChange={rate} disabled={setRating.isPending} />
            <span className="text-sm text-muted">{mine ? 'Tu calificación. Puedes cambiarla.' : '¿Cómo estuvo? Califícalo.'}</span>
          </div>
          {error && <ErrorNote message={error} />}
        </div>
      )}
    </section>
  )
}
