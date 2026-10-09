import { Badge, Card, EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { useAnnouncements } from '../features/announcements/api'
import { formatEventDate } from '../lib/dates'

export function AnnouncementsPage() {
  const announcements = useAnnouncements()

  return (
    <>
      <PageTitle>Anuncios</PageTitle>
      {announcements.isPending && <Spinner />}
      {announcements.isError && <ErrorNote message="No se pudieron cargar los anuncios." onRetry={() => announcements.refetch()} />}
      {announcements.isSuccess && announcements.data.length === 0 && <EmptyState>No hay anuncios por ahora.</EmptyState>}

      <ul className="space-y-4">
        {announcements.data?.map((a) => (
          <li key={a.id}>
            <Card className={`space-y-2 ${a.pinned ? 'border-l-4 border-l-red' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{a.title}</h2>
                {a.pinned && <Badge tone="red">Fijado</Badge>}
              </div>
              <p className="whitespace-pre-line text-steel">{a.body}</p>
              <p className="text-xs text-muted first-letter:uppercase">{formatEventDate(a.created_at)}</p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
