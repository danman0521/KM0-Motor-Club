import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { Avatar } from '../../components/Avatar'
import { Button, ErrorNote, Spinner } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { displayName } from '../../lib/supabase'
import { useAttendance, useSetAttendance } from './community'

/** Confirmación de asistencia. Con el evento ya empezado solo muestra quiénes confirmaron. */
export function AttendanceSection({ eventId, past }: { eventId: string; past: boolean }) {
  const { profile } = useAuth()
  const attendance = useAttendance(eventId)
  const setAttendance = useSetAttendance(eventId)
  const [error, setError] = useState('')

  const going = (attendance.data ?? []).filter((a) => a.status === 'going')
  const mine = attendance.data?.find((a) => a.profile?.id === profile?.id)?.status

  async function choose(status: 'going' | 'not_going') {
    setError('')
    try {
      await setAttendance.mutateAsync(status)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">{past ? 'Confirmaron asistencia' : '¿Vas a ir?'}</h2>

      {!past && (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Tu asistencia">
          <Button
            variant={mine === 'going' ? 'primary' : 'ghost'}
            aria-pressed={mine === 'going'}
            disabled={setAttendance.isPending}
            onClick={() => choose('going')}
          >
            Voy
          </Button>
          <Button
            variant={mine === 'not_going' ? 'secondary' : 'ghost'}
            aria-pressed={mine === 'not_going'}
            disabled={setAttendance.isPending}
            onClick={() => choose('not_going')}
          >
            No voy
          </Button>
          <span className="text-sm text-muted">
            {mine ? 'Puedes cambiarlo hasta que empiece el evento.' : 'Aún no has respondido.'}
          </span>
        </div>
      )}

      {error && <ErrorNote message={error} />}
      {attendance.isPending && <Spinner label="Cargando asistentes…" />}
      {attendance.isError && <ErrorNote message="No se pudo cargar la asistencia." onRetry={() => attendance.refetch()} />}

      {attendance.isSuccess && (
        <>
          <p className="mb-2 text-steel">
            {going.length === 0
              ? past
                ? 'Nadie confirmó asistencia.'
                : 'Todavía nadie ha confirmado.'
              : going.length === 1
                ? past
                  ? '1 miembro confirmó.'
                  : '1 miembro va.'
                : past
                  ? `${going.length} miembros confirmaron.`
                  : `${going.length} miembros van.`}
          </p>
          {going.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {going.map((a) => (
                <li key={a.profile?.id} className="flex items-center gap-2 rounded-full border border-surface-2 bg-surface py-1 pl-1 pr-3 text-sm">
                  <Avatar profile={a.profile} size="sm" />
                  {displayName(a.profile)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
