import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ChangeEvent } from 'react'
import { Badge, Button, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import type { EventRow } from '../../lib/supabase'
import { uploadEventPhoto, useDeletePhoto, useEventPhotos, useSetCover } from './api'

type Upload = { name: string; state: 'waiting' | 'uploading' | 'done' | 'error'; message?: string }

const uploadLabel = { waiting: 'En cola', uploading: 'Subiendo…', done: 'Lista', error: 'Falló' } as const

/** Subida múltiple con progreso por foto, elección de portada y borrado. */
export function PhotoManager({ event }: { event: EventRow }) {
  const queryClient = useQueryClient()
  const photos = useEventPhotos(event.id)
  const deletePhoto = useDeletePhoto(event.id)
  const setCover = useSetCover(event.id)
  const input = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    setBusy(true)
    setUploads(files.map((f) => ({ name: f.name, state: 'waiting' })))
    const patch = (i: number, next: Partial<Upload>) =>
      setUploads((list) => list.map((u, j) => (j === i ? { ...u, ...next } : u)))

    let firstPath: string | null = null
    // Una a una: si una foto falla, las demás continúan
    for (const [i, file] of files.entries()) {
      patch(i, { state: 'uploading' })
      try {
        const path = await uploadEventPhoto(event.id, file)
        firstPath ??= path
        patch(i, { state: 'done' })
      } catch (err) {
        patch(i, { state: 'error', message: friendlyError(err) })
      }
    }

    if (firstPath && !event.cover_photo_path) {
      await setCover.mutateAsync(firstPath).catch(() => undefined)
    }
    await queryClient.invalidateQueries({ queryKey: ['event-photos', event.id] })
    setBusy(false)
  }

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={handleFiles} aria-label="Elegir fotos" />
        <Button onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Subiendo fotos…' : 'Subir fotos'}
        </Button>
        <span className="text-sm text-muted">Puedes elegir varias. Se comprimen antes de subir.</span>
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-1 rounded-md border border-surface-2 p-3 text-sm" aria-label="Progreso de subida">
          {uploads.map((u, i) => (
            <li key={`${u.name}-${i}`} className="flex flex-wrap items-center justify-between gap-2">
              <span className="truncate">{u.name}</span>
              <span className={u.state === 'error' ? 'text-red-hover' : 'text-steel'}>
                {uploadLabel[u.state]}
                {u.message && `: ${u.message}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {actionError && <ErrorNote message={actionError} />}
      {photos.isPending && <Spinner label="Cargando fotos…" />}
      {photos.isError && <ErrorNote message="No se pudieron cargar las fotos." onRetry={() => photos.refetch()} />}
      {photos.isSuccess && photos.data.length === 0 && <EmptyState>Este evento aún no tiene fotos.</EmptyState>}

      {photos.isSuccess && photos.data.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.data.map((photo, i) => {
            const isCover = event.cover_photo_path === photo.storage_path
            return (
              <li key={photo.id} className="space-y-2 rounded-md border border-surface-2 p-2">
                <div className="relative aspect-square overflow-hidden rounded">
                  {photo.url && <img src={photo.url} alt={`Foto ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />}
                  {isCover && (
                    <span className="absolute left-1 top-1">
                      <Badge tone="cream">Portada</Badge>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isCover && (
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => run(() => setCover.mutateAsync(photo.storage_path))}>
                      Usar de portada
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      if (window.confirm('¿Borrar esta foto? No se puede deshacer.')) run(() => deletePhoto.mutateAsync(photo))
                    }}
                  >
                    Borrar
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
