import type { ReactNode } from 'react'
import { Badge } from '../../components/ui'
import { formatDay } from '../../lib/dates'
import { partnerLogoUrl, type Partner } from './api'

/** Tarjeta de un convenio. `actions` permite al panel de líderes añadir botones. */
export function PartnerCard({
  partner,
  actions,
  showCategory = true,
}: {
  partner: Partner
  actions?: ReactNode
  /** Falso cuando la lista ya está agrupada por categoría */
  showCategory?: boolean
}) {
  const logo = partnerLogoUrl(partner.logo_path)
  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-surface-2 bg-surface p-4">
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt={`Logo de ${partner.name}`} loading="lazy" className="h-14 w-14 shrink-0 rounded-md bg-ink object-contain" />
        ) : (
          <span aria-hidden className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-navy font-display text-2xl font-bold text-steel">
            {partner.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-xl font-bold">{partner.name}</h3>
          {showCategory && partner.category && <Badge tone="navy">{partner.category}</Badge>}
        </div>
      </div>

      <p className="rounded-md border-l-4 border-red bg-surface-2 px-3 py-2 font-semibold">{partner.benefit}</p>
      {partner.description && <p className="whitespace-pre-line text-sm text-steel">{partner.description}</p>}

      <dl className="mt-auto space-y-1 text-sm">
        {partner.phone && (
          <div className="flex gap-2">
            <dt className="text-muted">Teléfono:</dt>
            <dd>
              <a href={`tel:${partner.phone.replace(/[^\d+]/g, '')}`} className="underline hover:text-red-hover">
                {partner.phone}
              </a>
            </dd>
          </div>
        )}
        {partner.address && (
          <div className="flex gap-2">
            <dt className="text-muted">Dirección:</dt>
            <dd>{partner.address}</dd>
          </div>
        )}
        {partner.website && (
          <div className="flex gap-2">
            <dt className="text-muted">Sitio web:</dt>
            <dd className="min-w-0">
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="break-all underline hover:text-red-hover">
                {partner.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
              </a>
            </dd>
          </div>
        )}
        {partner.valid_until && (
          <div className="flex gap-2">
            <dt className="text-muted">Vigente hasta:</dt>
            <dd>{formatDay(partner.valid_until)}</dd>
          </div>
        )}
      </dl>

      {actions && <div className="flex flex-wrap gap-2 border-t border-surface-2 pt-3">{actions}</div>}
    </article>
  )
}
