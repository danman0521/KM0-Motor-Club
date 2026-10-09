import { useState } from 'react'
import { Badge, Button, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { AnnouncementForm } from '../../features/announcements/AnnouncementForm'
import {
  useAnnouncements,
  useDeleteAnnouncement,
  useSaveAnnouncement,
  useSetPinned,
  type Announcement,
} from '../../features/announcements/api'
import { formatEventDate } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'

export function LeaderAnnouncementsPage() {
  const announcements = useAnnouncements()
  const save = useSaveAnnouncement()
  const setPinned = useSetPinned()
  const del = useDeleteAnnouncement()
  // null = lista; 'new' = alta; un anuncio = edición
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)
  const [actionError, setActionError] = useState('')

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  if (editing) {
    const current = editing === 'new' ? undefined : editing
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{current ? 'Editar anuncio' : 'Nuevo anuncio'}</h2>
        <Card>
          <AnnouncementForm
            key={current?.id ?? 'nuevo'}
            initial={current}
            submitLabel={current ? 'Guardar cambios' : 'Publicar'}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await save.mutateAsync({ id: current?.id, input })
              setEditing(null)
            }}
          />
        </Card>
      </div>
    )
  }

  const busy = setPinned.isPending || del.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Anuncios</h2>
        <Button onClick={() => setEditing('new')}>Nuevo anuncio</Button>
      </div>

      {actionError && <ErrorNote message={actionError} />}
      {announcements.isPending && <Spinner />}
      {announcements.isError && <ErrorNote message="No se pudieron cargar los anuncios." onRetry={() => announcements.refetch()} />}
      {announcements.isSuccess && announcements.data.length === 0 && <EmptyState>Aún no hay anuncios. Crea el primero.</EmptyState>}

      <ul className="space-y-3">
        {announcements.data?.map((a) => (
          <li key={a.id}>
            <Card className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{a.title}</h3>
                  {a.pinned && <Badge tone="red">Fijado</Badge>}
                </div>
                <p className="text-xs text-muted first-letter:uppercase">{formatEventDate(a.created_at)}</p>
              </div>
              <p className="whitespace-pre-line text-sm text-steel">{a.body}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => setEditing(a)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  disabled={busy}
                  onClick={() => run(() => setPinned.mutateAsync({ id: a.id, pinned: !a.pinned }))}
                >
                  {a.pinned ? 'Desfijar' : 'Fijar'}
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1 text-xs"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`¿Borrar el anuncio "${a.title}"?`)) run(() => del.mutateAsync(a.id))
                  }}
                >
                  Borrar
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
