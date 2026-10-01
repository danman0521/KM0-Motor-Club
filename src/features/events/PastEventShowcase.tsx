import { useState } from 'react'
import { site } from '../../config/site'
import { formatEventDate } from '../../lib/dates'

type Props = {
  title: string
  startsAt: string
  location: string
  /** Fotos del evento que se muestran en la portada; la primera es la principal */
  photoUrls: string[]
}

/** Evento realizado en la portada pública: foto principal y miniaturas para cambiarla. */
export function PastEventShowcase({ title, startsAt, location, photoUrls }: Props) {
  const [active, setActive] = useState(0)
  const main = photoUrls[active] ?? photoUrls[0]

  return (
    <article className="overflow-hidden rounded-lg border border-surface-2 bg-surface">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-navy-dark">
        {main ? (
          <img src={main} alt={`Foto de ${title}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <img src={site.logo} alt="" className="h-24 w-24 opacity-40" />
        )}
      </div>

      {photoUrls.length > 1 && (
        <ul className="grid grid-cols-4 gap-1 p-1" aria-label={`Fotos de ${title}`}>
          {photoUrls.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1} de ${title}`}
                aria-pressed={i === active}
                className={`block aspect-square w-full overflow-hidden rounded border-2 ${
                  i === active ? 'border-red' : 'border-transparent hover:border-line'
                }`}
              >
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1 p-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-steel first-letter:uppercase">{formatEventDate(startsAt)}</p>
        {location && <p className="text-sm text-muted">{location}</p>}
      </div>
    </article>
  )
}
