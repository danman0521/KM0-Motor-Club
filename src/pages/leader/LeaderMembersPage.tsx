import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { Badge, Button, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { useMembers, useSetMemberRole, useSetMemberStatus } from '../../features/members/api'
import { formatDayOf } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import type { Profile } from '../../lib/supabase'

function MemberName({ member }: { member: Profile }) {
  return (
    <div>
      <p className="font-semibold">
        {member.full_name}
        {member.nickname && <span className="text-steel"> «{member.nickname}»</span>}
      </p>
      <p className="text-sm text-muted">Se registró el {formatDayOf(member.created_at)}</p>
    </div>
  )
}

export function LeaderMembersPage() {
  const { profile: me } = useAuth()
  const members = useMembers()
  const setStatus = useSetMemberStatus()
  const setRole = useSetMemberRole()
  const [actionError, setActionError] = useState('')

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
                  <MemberName member={m} />
                  <div className="flex gap-2">
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
        <h2 className="mb-3 text-2xl font-bold">Miembros ({approved.length})</h2>
        <ul className="space-y-3">
          {approved.map((m) => {
            const isMe = m.id === me?.id
            return (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <MemberName member={m} />
                    {m.role === 'leader' && <Badge tone="red">Líder</Badge>}
                    {isMe && <Badge>Tú</Badge>}
                  </div>
                  {!isMe && (
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      </section>

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
