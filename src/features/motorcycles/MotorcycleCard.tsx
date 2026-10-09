import type { ReactNode } from 'react'
import { site } from '../../config/site'
import { motorcyclePhotoUrl, type Motorcycle } from './api'

/** Tarjeta de una moto. `actions` permite añadir botones (editar/borrar). */
export function MotorcycleCard({ moto, actions }: { moto: Motorcycle; actions?: ReactNode }) {
  const photo = motorcyclePhotoUrl(moto.photo_path)
  const specs = [moto.year, moto.displacement_cc ? `${moto.displacement_cc} cc` : null, moto.color || null].filter(Boolean)
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-surface-2 bg-surface">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-gunmetal-dark">
        {photo ? (
          <img src={photo} alt={`${moto.brand} ${moto.model}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <img src={site.logo} alt="" className="h-16 w-16 opacity-40" />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-bold">
          {moto.brand} {moto.model}
        </h3>
        {specs.length > 0 && <p className="text-sm text-steel">{specs.join(' · ')}</p>}
        {moto.plate && <p className="text-sm text-muted">Placa: {moto.plate}</p>}
        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </div>
    </article>
  )
}
