import { ErrorNote, EmptyState, PageTitle, Spinner } from '../components/ui'
import { EventCard } from '../features/events/EventCard'
import { useEvents, useSignedUrls } from '../features/events/api'
import { useRatingSummaries } from '../features/events/community'
import { isPast } from '../lib/dates'

export function EventsPage() {
  const events = useEvents()
  const past = (events.data ?? []).filter((e) => isPast(e.starts_at))
  const ratings = useRatingSummaries()
  const covers = useSignedUrls(past.flatMap((e) => (e.cover_photo_path ? [e.cover_photo_path] : [])))

  return (
    <>
      <PageTitle>Eventos realizados</PageTitle>
      {events.isPending && <Spinner />}
      {events.isError && <ErrorNote message="No se pudieron cargar los eventos." onRetry={() => events.refetch()} />}
      {events.isSuccess && past.length === 0 && <EmptyState>Aún no hay eventos realizados.</EmptyState>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {past.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            coverUrl={event.cover_photo_path ? covers.data?.[event.cover_photo_path] : undefined}
            rating={ratings.data?.[event.id]}
          />
        ))}
      </div>
    </>
  )
}
