import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, EmptyState, ErrorNote, Modal, PageTitle, Spinner } from '../components/ui'
import { MotorcycleCard } from '../features/motorcycles/MotorcycleCard'
import { MotorcycleForm } from '../features/motorcycles/MotorcycleForm'
import { useDeleteMotorcycle, useMotorcycles, useSaveMotorcycle, type Motorcycle } from '../features/motorcycles/api'
import { friendlyError } from '../lib/errors'

/** Mi garaje: el miembro gestiona sus motos. */
export function GaragePage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const motos = useMotorcycles(userId)
  const save = useSaveMotorcycle(userId)
  const del = useDeleteMotorcycle(userId)
  // null = cerrado; 'new' = alta; una moto = edición
  const [editing, setEditing] = useState<Motorcycle | 'new' | null>(null)
  const [actionError, setActionError] = useState('')

  async function remove(moto: Motorcycle) {
    if (!window.confirm(`¿Borrar ${moto.brand} ${moto.model}?`)) return
    setActionError('')
    try {
      await del.mutateAsync(moto)
    } catch (err) {
      setActionError(friendlyError(err))
    }
  }

  return (
    <>
      <PageTitle
        action={
          <Link to="/perfil" className="text-sm text-steel hover:text-ink">
            ← Mi perfil
          </Link>
        }
      >
        Mi garaje
      </PageTitle>
      <div className="mb-4">
        <Button onClick={() => setEditing('new')}>Añadir moto</Button>
      </div>

      {actionError && <ErrorNote message={actionError} />}
      {motos.isPending && <Spinner />}
      {motos.isError && <ErrorNote message="No se pudieron cargar tus motos." onRetry={() => motos.refetch()} />}
      {motos.isSuccess && motos.data.length === 0 && <EmptyState>Aún no has añadido ninguna moto.</EmptyState>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {motos.data?.map((moto) => (
          <MotorcycleCard
            key={moto.id}
            moto={moto}
            actions={
              <>
                <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => setEditing(moto)}>
                  Editar
                </Button>
                <Button variant="danger" className="px-3 py-1 text-xs" disabled={del.isPending} onClick={() => remove(moto)}>
                  Borrar
                </Button>
              </>
            }
          />
        ))}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Añadir moto' : 'Editar moto'} onClose={() => setEditing(null)} wide>
          <Card>
            <MotorcycleForm
              key={editing === 'new' ? 'new' : editing.id}
              initial={editing === 'new' ? undefined : editing}
              hasPhoto={editing !== 'new' && !!editing.photo_path}
              submitLabel={editing === 'new' ? 'Añadir moto' : 'Guardar cambios'}
              onCancel={() => setEditing(null)}
              onSubmit={async (input) => {
                await save.mutateAsync({ id: editing === 'new' ? undefined : editing.id, input })
                setEditing(null)
              }}
            />
          </Card>
        </Modal>
      )}
    </>
  )
}
