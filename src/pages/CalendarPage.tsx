import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { MonthGrid } from '../features/calendar/MonthGrid'
import { useEvents } from '../features/events/api'
import { useGoingCounts } from '../features/events/community'
import { formatEventDate, formatMonth, isPast, monthStart } from '../lib/dates'

export function CalendarPage() {
  const events = useEvents()
  const going = useGoingCounts()
  const [today] = useState(() => new Date())
  const [cursor, setCursor] = useState({ year: today.getFullYear(), monthIndex: today.getMonth() })

  const move = (delta: number) =>
    setCursor(({ year, monthIndex }) => {
      const d = new Date(year, monthIndex + delta, 1)
      return { year: d.getFullYear(), monthIndex: d.getMonth() }
    })
  const goToday = () => setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() })

  const upcoming = (events.data ?? []).filter((e) => !isPast(e.starts_at)).reverse()

  return (
    <>
      <PageTitle>Calendario</PageTitle>
      {events.isPending && <Spinner />}
      {events.isError && <ErrorNote message="No se pudo cargar el calendario." onRetry={() => events.refetch()} />}
      {events.isSuccess && (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => move(-1)} aria-label="Mes anterior">
                ←
              </Button>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{formatMonth(monthStart(new Date(cursor.year, cursor.monthIndex, 1)))}</h2>
                <Button variant="ghost" onClick={goToday}>
                  Hoy
                </Button>
              </div>
              <Button variant="ghost" onClick={() => move(1)} aria-label="Mes siguiente">
                →
              </Button>
            </div>
            <MonthGrid year={cursor.year} monthIndex={cursor.monthIndex} events={events.data} today={today} />
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold">Próximos eventos</h2>
            {upcoming.length === 0 ? (
              <EmptyState>No hay eventos programados por ahora.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <Link
                      to={`/eventos/${e.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-surface-2 bg-surface px-4 py-3 hover:border-red"
                    >
                      <span className="font-display text-lg font-semibold uppercase">{e.title}</span>
                      <span className="text-sm text-steel first-letter:uppercase">
                        {formatEventDate(e.starts_at)}
                        {e.location && <span className="text-muted"> · {e.location}</span>}
                        {!!going.data?.[e.id] && (
                          <span className="text-silver">
                            {' '}
                            · {going.data[e.id] === 1 ? '1 va' : `${going.data[e.id]} van`}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
