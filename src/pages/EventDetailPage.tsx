import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Badge, ButtonLink, EmptyState, ErrorNote, Spinner } from '../components/ui'
import { AttendanceSection } from '../features/events/AttendanceSection'
import { CommentsSection } from '../features/events/CommentsSection'
import { PhotoGallery } from '../features/events/PhotoGallery'
import { RatingSection } from '../features/events/RatingSection'
import { useEvent, useEventPhotos, useEventVideos } from '../features/events/api'
import { formatEventDate, isPast } from '../lib/dates'
import { youTubeEmbedUrl } from '../lib/youtube'

export function EventDetailPage() {
  const { id } = useParams()
  const { isLeader } = useAuth()
  const event = useEvent(id)
  const photos = useEventPhotos(id)
  const videos = useEventVideos(id)

  if (event.isPending) return <Spinner />
  if (event.isError) return <ErrorNote message="No se pudo cargar el evento." onRetry={() => event.refetch()} />
  if (!event.data) return <EmptyState>Este evento no existe o fue eliminado.</EmptyState>

  const e = event.data
  const past = isPast(e.starts_at)

  return (
    <article className="space-y-8">
      <header className="space-y-3 border-b-2 border-red pb-4">
        <Link to={past ? '/eventos' : '/calendario'} className="text-sm text-steel hover:text-ink">
          ← {past ? 'Eventos realizados' : 'Calendario'}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-4xl font-bold">{e.title}</h1>
          {isLeader && (
            <ButtonLink variant="ghost" to={`/lider/eventos/${e.id}`}>
              Editar
            </ButtonLink>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-steel">
          <Badge tone={past ? 'neutral' : 'gunmetal'}>{past ? 'Realizado' : 'Próximo'}</Badge>
          <span className="first-letter:uppercase">{formatEventDate(e.starts_at)}</span>
          {e.location && <span className="text-muted">· {e.location}</span>}
        </div>
      </header>

      {e.description && <p className="whitespace-pre-line text-lg text-steel">{e.description}</p>}

      {!past && <AttendanceSection eventId={e.id} past={false} />}

      {e.chronicle && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Crónica</h2>
          <p className="whitespace-pre-line leading-relaxed">{e.chronicle}</p>
        </section>
      )}

      {past && <RatingSection eventId={e.id} />}

      <section>
        <h2 className="mb-3 text-2xl font-bold">Fotos</h2>
        {photos.isPending && <Spinner label="Cargando fotos…" />}
        {photos.isError && <ErrorNote message="No se pudieron cargar las fotos." onRetry={() => photos.refetch()} />}
        {photos.isSuccess && photos.data.length === 0 && <EmptyState>Este evento aún no tiene fotos.</EmptyState>}
        {photos.isSuccess && photos.data.length > 0 && <PhotoGallery photos={photos.data} />}
      </section>

      {videos.isError && <ErrorNote message="No se pudieron cargar los videos." onRetry={() => videos.refetch()} />}
      {videos.isSuccess && videos.data.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Videos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {videos.data.map((v) => (
              <figure key={v.id}>
                <iframe
                  className="aspect-video w-full rounded-md border border-surface-2"
                  src={youTubeEmbedUrl(v.youtube_id)}
                  title={v.title ?? 'Video del evento'}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {v.title && <figcaption className="mt-1 text-sm text-steel">{v.title}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Calificación y comentarios solo cuando el evento ya pasó */}
      {past && <AttendanceSection eventId={e.id} past />}
      {past && <CommentsSection eventId={e.id} />}
    </article>
  )
}
