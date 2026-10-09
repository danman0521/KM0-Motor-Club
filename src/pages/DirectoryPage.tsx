import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Card, EmptyState, ErrorNote, PageTitle, Spinner } from '../components/ui'
import { useDirectory, whatsappLink, type DirectoryMember } from '../features/directory/api'
import { formatDayMonth } from '../lib/dates'

function displayName(m: DirectoryMember): string {
  return m.nickname || m.full_name
}

export function DirectoryPage() {
  const directory = useDirectory()
  const [month] = useState(() => new Date().getMonth() + 1)

  const members = directory.data ?? []
  const birthdays = members
    .filter((m) => m.birth_month === month && m.birth_day != null)
    .sort((a, b) => (a.birth_day ?? 0) - (b.birth_day ?? 0))

  return (
    <>
      <PageTitle>Directorio</PageTitle>
      {directory.isPending && <Spinner />}
      {directory.isError && <ErrorNote message="No se pudo cargar el directorio." onRetry={() => directory.refetch()} />}

      {directory.isSuccess && (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-2xl font-bold">Cumpleaños de este mes</h2>
            {birthdays.length === 0 ? (
              <EmptyState>Nadie cumple años este mes.</EmptyState>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {birthdays.map((m) => (
                  <li key={m.profile_id} className="flex items-center gap-3 rounded-full border border-cream/40 bg-surface py-1 pl-1 pr-4">
                    <Avatar profile={{ full_name: m.full_name, avatar_path: m.avatar_path }} />
                    <div className="text-sm">
                      <p className="font-semibold">{displayName(m)}</p>
                      <p className="text-cream">{formatDayMonth(m.birth_month!, m.birth_day!)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold">Miembros ({members.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => {
                const wa = whatsappLink(m.phone)
                return (
                  <Card key={m.profile_id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar profile={{ full_name: m.full_name, avatar_path: m.avatar_path }} size="lg" />
                      <div className="min-w-0">
                        <p className="text-lg font-bold">{m.full_name}</p>
                        {m.nickname && <p className="text-steel">«{m.nickname}»</p>}
                      </div>
                    </div>
                    <dl className="space-y-1 text-sm">
                      {m.city && (
                        <div className="flex gap-2">
                          <dt className="text-muted">Vive en:</dt>
                          <dd>{m.city}</dd>
                        </div>
                      )}
                      {m.occupation && (
                        <div className="flex gap-2">
                          <dt className="text-muted">Se dedica a:</dt>
                          <dd>{m.occupation}</dd>
                        </div>
                      )}
                      {m.phone && (
                        <div className="flex flex-wrap items-center gap-2">
                          <dt className="text-muted">Teléfono:</dt>
                          <dd className="flex flex-wrap items-center gap-2">
                            <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`} className="underline hover:text-red-hover">
                              {m.phone}
                            </a>
                            {wa && (
                              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-steel underline hover:text-ink">
                                WhatsApp ↗
                              </a>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                    {m.motorcycles.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Motos</p>
                        <ul className="text-sm text-steel">
                          {m.motorcycles.map((moto) => (
                            <li key={moto.id}>
                              {moto.brand} {moto.model}
                              {moto.displacement_cc ? ` · ${moto.displacement_cc} cc` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
