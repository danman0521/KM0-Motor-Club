import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, ErrorNote, Spinner } from '../components/ui'
import { ApplicationForm } from '../features/applications/ApplicationForm'
import { useApplication, useSaveApplication } from '../features/applications/api'

/**
 * Pantalla de espera: primero la ficha de postulación y, una vez enviada,
 * el mensaje de que un líder la revisará.
 */
export function PendingPage() {
  const { session, profile, loading, isApproved, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  // Cuando un líder aprueba, la pantalla se entera sola
  useEffect(() => {
    if (!session || isApproved) return
    const id = window.setInterval(() => refreshProfile(), 30_000)
    return () => window.clearInterval(id)
  }, [session, isApproved, refreshProfile])

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/ingresar" replace />
  if (isApproved) return <Navigate to="/eventos" replace />

  async function check() {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
  }

  async function leave() {
    navigate('/')
    await signOut()
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Card className="space-y-4">
          <h1 className="text-2xl font-bold">Solicitud rechazada</h1>
          <p className="text-steel">
            Un líder rechazó tu solicitud de ingreso. Si crees que es un error, habla con los líderes del grupo.
          </p>
          <Button variant="ghost" onClick={leave}>
            Cerrar sesión
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <ApplicationStep
      userId={session.user.id}
      hasRiderPhoto={!!profile?.avatar_path}
      waiting={
        <Card className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Esperando aprobación</h1>
          <p className="text-steel">Tu ficha fue enviada. Un líder la revisará y te dará acceso a la zona de miembros.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={check} disabled={checking}>
              {checking ? 'Comprobando…' : 'Comprobar de nuevo'}
            </Button>
            <Button variant="ghost" onClick={leave}>
              Cerrar sesión
            </Button>
          </div>
        </Card>
      }
    />
  )
}

function ApplicationStep({ userId, hasRiderPhoto, waiting }: { userId: string; hasRiderPhoto: boolean; waiting: ReactNode }) {
  const application = useApplication(userId)
  const save = useSaveApplication(userId)
  const [editing, setEditing] = useState(false)

  if (application.isPending) return <Spinner />
  if (application.isError) return <ErrorNote message="No se pudo cargar tu ficha." onRetry={() => application.refetch()} />

  if (application.data && !editing) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        {waiting}
        <p className="text-center text-sm text-muted">
          ¿Te faltó algo?{' '}
          <button type="button" onClick={() => setEditing(true)} className="font-semibold text-steel underline hover:text-ink">
            Editar mi ficha
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{application.data ? 'Editar mi ficha' : 'Completa tu postulación'}</h1>
        <p className="text-steel">
          Para que los líderes puedan revisar tu solicitud, cuéntanos un poco sobre ti y deja tus datos de seguridad.
        </p>
      </div>
      <Card>
        <ApplicationForm
          initial={application.data ?? undefined}
          hasRiderPhoto={hasRiderPhoto}
          hasMotoPhoto={!!application.data?.moto_photo_path}
          submitLabel={application.data ? 'Guardar cambios' : 'Enviar postulación'}
          onCancel={application.data ? () => setEditing(false) : undefined}
          onSubmit={async (submission) => {
            await save.mutateAsync(submission)
            setEditing(false)
          }}
        />
      </Card>
    </div>
  )
}
