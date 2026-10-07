import { Badge } from '../../components/ui'
import { site } from '../../config/site'
import { formatMonth } from '../../lib/dates'

type Props = {
  name: string
  reason: string
  month: string
  photoUrl?: string
  /** `hero` para el destacado actual; `compact` para el salón de la fama */
  size?: 'hero' | 'compact'
}

export function FeaturedCard({ name, reason, month, photoUrl, size = 'compact' }: Props) {
  const hero = size === 'hero'
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface ${hero ? 'border-silver md:flex' : 'border-surface-2'}`}
    >
      <div className={`flex items-center justify-center bg-gunmetal-dark ${hero ? 'aspect-square md:w-80 md:shrink-0' : 'aspect-square'}`}>
        {photoUrl ? (
          <img src={photoUrl} alt={`Foto de ${name}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <img src={site.logo} alt="" className="h-24 w-24 opacity-40" />
        )}
      </div>
      <div className={`space-y-2 ${hero ? 'p-6' : 'p-4'}`}>
        <Badge tone={hero ? 'silver' : 'gunmetal'}>
          <span className="first-letter:uppercase">{formatMonth(month)}</span>
        </Badge>
        <h3 className={`font-bold ${hero ? 'text-4xl' : 'text-xl'}`}>{name}</h3>
        <p className={`whitespace-pre-line text-steel ${hero ? 'text-lg' : 'text-sm'}`}>{reason}</p>
      </div>
    </div>
  )
}
