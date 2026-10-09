import { useState } from 'react'
import { EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { FeaturedCard } from '../features/featured/FeaturedCard'
import { featuredDisplayPhoto, useFeaturedRiders } from '../features/featured/api'
import { monthStart } from '../lib/dates'
import { displayName } from '../lib/supabase'

export function FeaturedPage() {
  const featured = useFeaturedRiders()
  const [thisMonth] = useState(() => monthStart(new Date()))
  const current = featured.data?.find((f) => f.month === thisMonth)
  const previous = (featured.data ?? []).filter((f) => f.month < thisMonth)

  return (
    <>
      <PageTitle>Motero destacado</PageTitle>
      {featured.isPending && <Spinner />}
      {featured.isError && <ErrorNote message="No se pudo cargar el destacado." onRetry={() => featured.refetch()} />}
      {featured.isSuccess && (
        <div className="space-y-10">
          <section>
            {current ? (
              <FeaturedCard
                size="hero"
                name={displayName(current.profile)}
                reason={current.reason}
                month={current.month}
                photoUrl={featuredDisplayPhoto(current.photo_path, current.profile?.avatar_path)}
              />
            ) : (
              <EmptyState>Aún no se ha elegido al motero destacado de este mes.</EmptyState>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">Salón de la fama</h2>
            {previous.length === 0 ? (
              <EmptyState>Todavía no hay destacados de meses anteriores.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {previous.map((f) => (
                  <FeaturedCard
                    key={f.id}
                    name={displayName(f.profile)}
                    reason={f.reason}
                    month={f.month}
                    photoUrl={featuredDisplayPhoto(f.photo_path, f.profile?.avatar_path)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}
