import { useState } from 'react'
import { Badge, Button, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { PartnerCard } from '../../features/partners/PartnerCard'
import { PartnerForm } from '../../features/partners/PartnerForm'
import { useDeletePartner, usePartners, useSavePartner, useSetPartnerActive, type Partner } from '../../features/partners/api'
import { friendlyError } from '../../lib/errors'

export function LeaderPartnersPage() {
  const partners = usePartners()
  const save = useSavePartner()
  const setActive = useSetPartnerActive()
  const deletePartner = useDeletePartner()
  // null = lista; 'new' = formulario vacío; un convenio = edición
  const [editing, setEditing] = useState<Partner | 'new' | null>(null)
  const [actionError, setActionError] = useState('')
  const [today] = useState(() => new Date().toLocaleDateString('en-CA'))

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  if (editing) {
    const current = editing === 'new' ? undefined : editing
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{current ? `Editar ${current.name}` : 'Nuevo convenio'}</h2>
        <Card>
          <PartnerForm
            key={current?.id ?? 'nuevo'}
            initial={current}
            hasLogo={!!current?.logo_path}
            submitLabel={current ? 'Guardar cambios' : 'Crear convenio'}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await save.mutateAsync({ current, input })
              setEditing(null)
            }}
          />
        </Card>
      </div>
    )
  }

  const busy = setActive.isPending || deletePartner.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Convenios</h2>
        <Button onClick={() => setEditing('new')}>Nuevo convenio</Button>
      </div>

      {actionError && <ErrorNote message={actionError} />}
      {partners.isPending && <Spinner />}
      {partners.isError && <ErrorNote message="No se pudieron cargar los convenios." onRetry={() => partners.refetch()} />}
      {partners.isSuccess && partners.data.length === 0 && <EmptyState>Aún no hay convenios. Crea el primero.</EmptyState>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.data?.map((partner) => {
          const expired = !!partner.valid_until && partner.valid_until < today
          return (
            <div key={partner.id} className="flex flex-col gap-2">
              {(!partner.active || expired) && (
                <div className="flex gap-2">
                  {!partner.active && <Badge>Oculto</Badge>}
                  {expired && <Badge tone="red">Vencido</Badge>}
                </div>
              )}
              <PartnerCard
                partner={partner}
                actions={
                  <>
                    <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => setEditing(partner)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1 text-xs"
                      disabled={busy}
                      onClick={() => run(() => setActive.mutateAsync({ id: partner.id, active: !partner.active }))}
                    >
                      {partner.active ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1 text-xs"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`¿Borrar el convenio con ${partner.name}? No se puede deshacer.`)) {
                          run(() => deletePartner.mutateAsync(partner))
                        }
                      }}
                    >
                      Borrar
                    </Button>
                  </>
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
