import { useState } from 'react'
import { Button, Card, EmptyState, ErrorNote, Field, Spinner } from '../../components/ui'
import { FeaturedForm } from '../../features/featured/FeaturedForm'
import { featuredPhotoUrl, useFeaturedRiders, useSaveFeatured } from '../../features/featured/api'
import { useMembers } from '../../features/members/api'
import { formatMonth, monthStart } from '../../lib/dates'
import { displayName } from '../../lib/supabase'

export function LeaderFeaturedPage() {
  const featured = useFeaturedRiders()
  const members = useMembers()
  const save = useSaveFeatured()
  const [month, setMonth] = useState(() => monthStart(new Date()))

  if (featured.isPending || members.isPending) return <Spinner />
  if (featured.isError || members.isError) {
    return (
      <ErrorNote
        message="No se pudo cargar el destacado."
        onRetry={() => {
          featured.refetch()
          members.refetch()
        }}
      />
    )
  }

  const editing = featured.data.find((f) => f.month === month)
  const approved = members.data.filter((m) => m.status === 'approved')

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 text-2xl font-bold">
          {editing ? 'Editar destacado de ' : 'Elegir destacado de '}
          {formatMonth(month)}
        </h2>
        <Card className="space-y-4">
          <Field label="Mes">
            {(p) => (
              <input
                {...p}
                type="month"
                value={month.slice(0, 7)}
                onChange={(e) => e.target.value && setMonth(`${e.target.value}-01`)}
              />
            )}
          </Field>
          <FeaturedForm
            // Al cambiar de mes el formulario se recarga con los datos de ese mes
            key={month}
            members={approved}
            initial={{ month, profile_id: editing?.profile_id ?? '', reason: editing?.reason ?? '' }}
            hasPhoto={!!editing?.photo_path}
            onSubmit={(input) => save.mutateAsync(input)}
          />
        </Card>
        <p className="mt-2 text-sm text-muted">Hay un solo destacado por mes. Si el mes ya tiene uno, se actualiza.</p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Destacados elegidos</h2>
        {featured.data.length === 0 ? (
          <EmptyState>Aún no se ha elegido ningún destacado.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {featured.data.map((f) => (
              <li key={f.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {f.photo_path && (
                      <img src={featuredPhotoUrl(f.photo_path)} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                    )}
                    <div>
                      <p className="font-semibold">{displayName(f.profile)}</p>
                      <p className="text-sm text-steel first-letter:uppercase">{formatMonth(f.month)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setMonth(f.month)} disabled={f.month === month}>
                    {f.month === month ? 'Editando' : 'Editar'}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
