import { useState, type FormEvent } from 'react'
import { Button, EmptyState, ErrorNote, Field } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { parseYouTubeId } from '../../lib/youtube'
import { useAddVideo, useDeleteVideo, useEventVideos } from './api'

/** Videos del evento como enlaces de YouTube. */
export function VideoManager({ eventId }: { eventId: string }) {
  const videos = useEventVideos(eventId)
  const addVideo = useAddVideo(eventId)
  const deleteVideo = useDeleteVideo(eventId)
  const [link, setLink] = useState('')
  const [title, setTitle] = useState('')
  const [linkError, setLinkError] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const youtubeId = parseYouTubeId(link)
    if (!youtubeId) {
      setLinkError('Pega un enlace válido de YouTube.')
      return
    }
    setLinkError('')
    try {
      await addVideo.mutateAsync({ youtubeId, title: title.trim() })
      setLink('')
      setTitle('')
    } catch (err) {
      const duplicated = (err as { code?: string }).code === '23505'
      setFormError(duplicated ? 'Ese video ya está en el evento.' : friendlyError(err))
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Quitar este video del evento?')) return
    setFormError('')
    try {
      await deleteVideo.mutateAsync(id)
    } catch (err) {
      setFormError(friendlyError(err))
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} noValidate className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-start">
        <Field label="Enlace de YouTube" error={linkError}>
          {(p) => (
            <input {...p} placeholder="https://youtu.be/…" value={link} onChange={(e) => setLink(e.target.value)} />
          )}
        </Field>
        <Field label="Título (opcional)">{(p) => <input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Button type="submit" disabled={addVideo.isPending} className="sm:mt-6">
          Añadir video
        </Button>
      </form>

      {formError && <ErrorNote message={formError} />}
      {videos.isError && <ErrorNote message="No se pudieron cargar los videos." onRetry={() => videos.refetch()} />}
      {videos.isSuccess && videos.data.length === 0 && <EmptyState>Este evento aún no tiene videos.</EmptyState>}

      {videos.isSuccess && videos.data.length > 0 && (
        <ul className="space-y-2">
          {videos.data.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-surface-2 p-2">
              <div className="flex items-center gap-3">
                <img
                  src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`}
                  alt=""
                  className="h-12 w-16 rounded object-cover"
                  loading="lazy"
                />
                <span>{v.title || `Video ${v.youtube_id}`}</span>
              </div>
              <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(v.id)}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
