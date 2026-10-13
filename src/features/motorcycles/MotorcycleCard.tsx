import type { ReactNode } from 'react'
import { FadeImg } from '../../components/ui'
import { site } from '../../config/site'
import { motorcyclePhotoUrl, type Motorcycle } from './api'

/** Tarjeta de una moto. `actions` permite añadir botones (editar/borrar). */
export function MotorcycleCard({ moto, actions }: { moto: Motorcycle; actions?: ReactNode }) {
  const photo = motorcyclePhotoUrl(moto.photo_path)
  const specs = [moto.year, moto.displacement_cc ? `${moto.displacement_cc} cc` : null, moto.color || null].filter(Boolean)
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-surface-2 bg-surface transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-line hover:shadow-[0_14px_34px_-18px_rgba(0,0,0,0.85)] motion-reduce:transform-none">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-gunmetal-dark">
        {photo ? (
          <FadeImg src={photo} alt={`${moto.brand} ${moto.model}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none" />
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
