import { useState } from 'react'
import { EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { site } from '../config/site'
import { PartnerCard } from '../features/partners/PartnerCard'
import { usePartners, type Partner } from '../features/partners/api'

const NO_CATEGORY = 'Otros'

/** Convenios vigentes agrupados por categoría. */
export function PartnersPage() {
  const partners = usePartners()

  // Los líderes reciben también los inactivos y vencidos; aquí se muestra lo que ve un miembro
  const [today] = useState(() => new Date().toLocaleDateString('en-CA'))
  const visible = (partners.data ?? []).filter((p) => p.active && (!p.valid_until || p.valid_until >= today))

  const groups = new Map<string, Partner[]>()
  for (const partner of visible) {
    const key = partner.category || NO_CATEGORY
    groups.set(key, [...(groups.get(key) ?? []), partner])
  }
  const sorted = [...groups.entries()].sort(([a], [b]) =>
    a === NO_CATEGORY ? 1 : b === NO_CATEGORY ? -1 : a.localeCompare(b, 'es'),
  )

  return (
    <>
      <PageTitle>Convenios</PageTitle>
      <p className="mb-6 max-w-2xl text-steel">
        Empresas aliadas con beneficios para los miembros de {site.name}. Identifícate como miembro del grupo para hacerlos válidos.
      </p>
      {partners.isPending && <Spinner />}
      {partners.isError && <ErrorNote message="No se pudieron cargar los convenios." onRetry={() => partners.refetch()} />}
      {partners.isSuccess && visible.length === 0 && <EmptyState>Aún no hay convenios vigentes.</EmptyState>}

      <div className="space-y-8">
        {sorted.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-2xl font-bold">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} showCategory={false} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
