import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../../components/ui'
import type { PhotoWithUrl } from './api'

/** Cuadrícula de fotos con visor ampliado (flechas del teclado para navegar). */
export function PhotoGallery({ photos }: { photos: PhotoWithUrl[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const visible = photos.filter((p) => p.url)

  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, step])

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ampliar foto ${i + 1}`}
              className="block aspect-square w-full overflow-hidden rounded-md border border-surface-2 hover:border-red"
            >
              <img src={photo.url} alt={`Foto ${i + 1} del evento`} loading="lazy" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {index !== null && visible[index] && (
        <Modal title={`Foto ${index + 1} de ${visible.length}`} onClose={close} wide>
          <img src={visible[index].url} alt={`Foto ${index + 1} del evento`} className="mx-auto max-h-[70dvh] rounded-md" />
          {visible.length > 1 && (
            <div className="mt-3 flex justify-between">
              <button type="button" onClick={() => step(-1)} className="rounded-md border border-line px-4 py-2 hover:bg-surface-2">
                ← Anterior
              </button>
              <button type="button" onClick={() => step(1)} className="rounded-md border border-line px-4 py-2 hover:bg-surface-2">
                Siguiente →
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
