import { useAuth } from '../auth/AuthProvider'
import { ButtonLink, Card, EmptyState, ErrorNote, Spinner } from '../components/ui'
import { site } from '../config/site'
import { FeaturedCard } from '../features/featured/FeaturedCard'
import { featuredPhotoUrl, usePublicHome } from '../features/featured/api'
import { formatEventDate } from '../lib/dates'

export function HomePage() {
  const { session, isApproved } = useAuth()
  const home = usePublicHome()

  return (
    <div className="space-y-14">
      <section className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <img src={site.logo} alt={`Logo de ${site.name}`} className="h-56 w-56 rounded-full md:h-72 md:w-72" />
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-red-hover md:text-7xl">{site.name}</h1>
          <p className="font-display text-2xl uppercase tracking-wide text-steel">{site.tagline}</p>
          <p className="max-w-xl text-lg">{site.about}</p>
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            {isApproved ? (
              <ButtonLink to="/eventos">Entrar a la zona de miembros</ButtonLink>
            ) : session ? (
              <ButtonLink to="/pendiente">Ver el estado de mi solicitud</ButtonLink>
            ) : (
              <>
                <ButtonLink to="/ingresar">Ingresar</ButtonLink>
                <ButtonLink to="/registro" variant="secondary">
                  Registrarse
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </section>

      {home.isPending && <Spinner />}
      {home.isError && <ErrorNote message="No se pudo cargar la información del grupo." onRetry={() => home.refetch()} />}

      {home.isSuccess && (
        <>
          <section>
            <h2 className="mb-4 border-b-2 border-red pb-2 text-3xl font-bold">Próximos eventos</h2>
            {home.data.upcoming.length === 0 ? (
              <EmptyState>No hay eventos programados por ahora.</EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {home.data.upcoming.map((e) => (
                  <Card key={`${e.title}-${e.starts_at}`} className="space-y-1 border-l-4 border-l-red">
                    <h3 className="text-xl font-bold">{e.title}</h3>
                    <p className="text-sm text-steel first-letter:uppercase">{formatEventDate(e.starts_at)}</p>
                    {e.location && <p className="text-sm text-muted">{e.location}</p>}
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 border-b-2 border-red pb-2 text-3xl font-bold">Motero destacado del mes</h2>
            {home.data.featured ? (
              <FeaturedCard
                size="hero"
                name={home.data.featured.display_name}
                reason={home.data.featured.reason}
                month={home.data.featured.month}
                photoUrl={featuredPhotoUrl(home.data.featured.photo_path)}
              />
            ) : (
              <EmptyState>Aún no se ha elegido al motero destacado de este mes.</EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  )
}
