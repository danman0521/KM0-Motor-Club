import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { Avatar } from '../../components/Avatar'
import { Badge, Button, Card, EmptyState, ErrorNote, Modal, SkeletonList } from '../../components/ui'
import { ApplicationDetails } from '../../features/applications/ApplicationDetails'
import { useApplicationIds } from '../../features/applications/api'
import { fetchMemberExportRows } from '../../features/members/export'
import { useDeleteMember, useMembers, useSetMemberRole, useSetMemberStatus } from '../../features/members/api'
import { toCsv, downloadCsv } from '../../lib/csv'
import { formatDayOf } from '../../lib/dates'
import { friendlyError } from '../../lib/errors'
import { rideRoleLabel, type Profile } from '../../lib/supabase'

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
  const del = useDeleteMember()
  const [actionError, setActionError] = useState('')
  const applications = useApplicationIds()
  // Miembro cuya ficha se está viendo en el diálogo
  const [viewing, setViewing] = useState<Profile | null>(null)
  // Miembro que se va a eliminar definitivamente, y el nombre tecleado para confirmar
  const [deleting, setDeleting] = useState<Profile | null>(null)
  const [confirmName, setConfirmName] = useState('')
  // Búsqueda y filtro de la lista de miembros aprobados
  const [query, setQuery] = useState('')
  const [onlyNoFicha, setOnlyNoFicha] = useState(false)
  // Exportar a CSV
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setActionError('')
    setExporting(true)
    try {
      const rows = await fetchMemberExportRows()
      downloadCsv(`moteros-kmo-${new Date().toLocaleDateString('en-CA')}.csv`, toCsv(rows))
    } catch (err) {
      setActionError(friendlyError(err))
    } finally {
      setExporting(false)
    }
  }

  const hasFicha = (m: Profile) => applications.data?.has(m.id) ?? false

  // Insignia de color del estado de la ficha
  const fichaBadge = (m: Profile) =>
    hasFicha(m) ? <Badge tone="green">Con ficha</Badge> : <Badge tone="red">Sin ficha</Badge>

  // Insignia de piloto/copiloto, si lo eligió
  const rideBadge = (m: Profile) => (m.ride_role ? <Badge tone="silver">{rideRoleLabel(m.ride_role)}</Badge> : null)

  // Botón para abrir la ficha; solo si existe
  const fichaButton = (m: Profile) =>
    hasFicha(m) ? (
      <Button variant="ghost" onClick={() => setViewing(m)}>
        Ver ficha
      </Button>
    ) : null

  // Botón para eliminar definitivamente; nunca sobre uno mismo
  const deleteButton = (m: Profile) =>
    m.id === me?.id ? null : (
      <Button
        variant="danger"
        onClick={() => {
          setConfirmName('')
          setDeleting(m)
        }}
      >
        Eliminar
      </Button>
    )

  function closeDelete() {
    setDeleting(null)
    setConfirmName('')
  }

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  if (members.isPending) return <SkeletonList rows={5} />
  if (members.isError) return <ErrorNote message="No se pudieron cargar los miembros." onRetry={() => members.refetch()} />

  const pending = members.data.filter((m) => m.status === 'pending')
  const approved = members.data.filter((m) => m.status === 'approved')
  const rejected = members.data.filter((m) => m.status === 'rejected')
  const busy = setStatus.isPending || setRole.isPending || del.isPending

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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-surface-2 bg-surface px-4 py-3">
        <p className="text-sm text-steel">Descarga todos los datos de los moteros (pilotos y copilotos) para abrir en Excel.</p>
        <Button variant="secondary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'Preparando…' : 'Descargar datos (CSV)'}
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Postulantes (en filtro)</h2>
        {pending.length === 0 ? (
          <EmptyState>No hay postulantes en filtro.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {pending.map((m) => (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <MemberName member={m} />
                    {fichaBadge(m)}
                    {rideBadge(m)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fichaButton(m)}
                    <Button disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'approved' }))}>
                      Pasar a oficial
                    </Button>
                    <Button variant="danger" disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'rejected' }))}>
                      Rechazar
                    </Button>
                    {deleteButton(m)}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Moteros oficiales ({approved.length})</h2>
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
                    {rideBadge(m)}
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
                      <Button variant="ghost" disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'pending' }))}>
                        Mover a filtro
                      </Button>
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
                  {deleteButton(m)}
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

      {deleting && (
        <Modal title="Eliminar definitivamente" onClose={closeDelete}>
          <div className="space-y-4">
            <p className="text-steel">
              Esta acción <span className="font-semibold text-red-hover">no se puede deshacer</span>. Se eliminará la cuenta de{' '}
              <span className="font-semibold text-ink">{deleting.full_name}</span> y todos sus datos personales: ficha, motos,
              asistencias, calificaciones, comentarios y archivos. El contenido del club que haya creado se conserva sin autor.
            </p>
            <label className="block space-y-1">
              <span className="text-sm text-steel">
                Escribe <span className="font-semibold text-ink">{deleting.full_name}</span> para confirmar.
              </span>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
                className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-ink placeholder:text-muted focus:border-red focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={closeDelete}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={busy || confirmName.trim().toLowerCase() !== deleting.full_name.trim().toLowerCase()}
                onClick={() => {
                  const target = deleting.id
                  closeDelete()
                  run(() => del.mutateAsync(target))
                }}
              >
                Eliminar definitivamente
              </Button>
            </div>
          </div>
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
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" disabled={busy} onClick={() => run(() => setStatus.mutateAsync({ id: m.id, status: 'approved' }))}>
                      Aprobar
                    </Button>
                    {deleteButton(m)}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
