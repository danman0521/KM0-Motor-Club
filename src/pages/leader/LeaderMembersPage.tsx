import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { Avatar } from '../../components/Avatar'
import { Badge, Button, Card, EmptyState, ErrorNote, Modal, Spinner } from '../../components/ui'
import { ApplicationDetails } from '../../features/applications/ApplicationDetails'
import { useApplicationIds } from '../../features/applications/api'
import { useMembers, useSetMemberRole, useSetMemberStatus } from '../../features/members/api'
import { formatDayOf } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import type { Profile } from '../../lib/supabase'

function MemberName({ member }: { member: Profile }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar profile={member} />
      <div>
      <p className="font-semibold">
        {member.full_name}
        {member.nickname && <span className="text-steel"> «{member.nickname}»</span>}
      </p>
      <p className="text-sm text-muted">Se registró el {formatDayOf(member.created_at)}</p>
      </div>
    </div>
  )
}

export function LeaderMembersPage() {
  const { profile: me } = useAuth()
  const members = useMembers()
  const setStatus = useSetMemberStatus()
  const setRole = useSetMemberRole()
  const [actionError, setActionError] = useState('')
  const applications = useApplicationIds()
  // Miembro cuya ficha se está viendo en el diálogo
  const [viewing, setViewing] = useState<Profile | null>(null)
  // Búsqueda y filtro de la lista de miembros aprobados
  const [query, setQuery] = useState('')
  const [onlyNoFicha, setOnlyNoFicha] = useState(false)

  const hasFicha = (m: Profile) => applications.data?.has(m.id) ?? false

  // Insignia de color del estado de la ficha
  const fichaBadge = (m: Profile) =>
    hasFicha(m) ? <Badge tone="green">Con ficha</Badge> : <Badge tone="red">Sin ficha</Badge>

  // Botón para abrir la ficha; solo si existe
  const fichaButton = (m: Profile) =>
    hasFicha(m) ? (
      <Button variant="ghost" onClick={() => setViewing(m)}>
        Ver ficha
      </Button>
    ) : null

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  if (members.isPending) return <Spinner />
  if (members.isError) return <ErrorNote message="No se pudieron cargar los miembros." onRetry={() => members.refetch()} />

  const pending = members.data.filter((m) => m.status === 'pending')
  const approved = members.data.filter((m) => m.status === 'approved')
  const rejected = members.data.filter((m) => m.status === 'rejected')
  const busy = setStatus.isPending || setRole.isPending

  // Lista de miembros aprobados tras aplicar la búsqueda y el filtro de ficha.
  // Se ignoran mayúsculas y tildes para que «julian» encuentre a «Julián».
  const fold = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
  const term = fold(query.trim())
  const visibleApproved = approved.filter((m) => {
    if (onlyNoFicha && hasFicha(m)) return false
    if (!term) return true
    return fold(`${m.full_name} ${m.nickname ?? ''}`).includes(term)
  })

  return (
    <div className="space-y-10">
      {actionError && <ErrorNote message={actionError} />}

      <section>
        <h2 className="mb-3 text-2xl font-bold">Solicitudes pendientes</h2>
        {pending.length === 0 ? (
          <EmptyState>No hay solicitudes por revisar.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {pending.map((m) => (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <MemberName member={m} />
                    {fichaBadge(m)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fichaButton(m)}
                    <Button disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'approved' }))}>
                      Aprobar
                    </Button>
                    <Button variant="danger" disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'rejected' }))}>
                      Rechazar
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Miembros ({approved.length})</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o apodo…"
              className="w-56 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-red focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-steel">
              <input type="checkbox" checked={onlyNoFicha} onChange={(e) => setOnlyNoFicha(e.target.checked)} className="accent-red" />
              Solo sin ficha
            </label>
          </div>
        </div>
        {visibleApproved.length === 0 ? (
          <EmptyState>Ningún motero coincide con la búsqueda.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {visibleApproved.map((m) => {
              const isMe = m.id === me?.id
            return (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <MemberName member={m} />
                    {fichaBadge(m)}
                    {m.role === 'leader' && <Badge tone="red">Líder</Badge>}
                    {isMe && <Badge>Tú</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fichaButton(m)}
                  {!isMe && (
                    <>
                      {m.role === 'leader' ? (
                        <Button variant="ghost" disabled={busy} onClick={() => run(() => setRole.mutateAsync({ id: m.id, role: 'member' }))}>
                          Quitar líder
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled={busy} onClick={() => run(() => setRole.mutateAsync({ id: m.id, role: 'leader' }))}>
                          Nombrar líder
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`¿Revocar el acceso de ${m.full_name}? Podrás volver a aprobarlo después.`)) {
                            run(() => setStatus.mutateAsync({ id: m.id, status: 'rejected' }))
                          }
                        }}
                      >
                        Revocar acceso
                      </Button>
                    </>
                  )}
                  </div>
                </Card>
              </li>
            )
            })}
          </ul>
        )}
      </section>

      {viewing && (
        <Modal title="Ficha de postulación" onClose={() => setViewing(null)} wide>
          <ApplicationDetails profile={viewing} />
        </Modal>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Rechazados o sin acceso</h2>
          <ul className="space-y-3">
            {rejected.map((m) => (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <MemberName member={m} />
                  <Button variant="ghost" disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'approved' }))}>
                    Aprobar
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
