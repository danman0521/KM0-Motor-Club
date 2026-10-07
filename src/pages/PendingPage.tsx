import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button, Card, Spinner } from '../components/ui'

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

  const rejected = profile?.status === 'rejected'

  async function check() {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
  }

  async function leave() {
    navigate('/')
    await signOut()
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">{rejected ? 'Solicitud rechazada' : 'Esperando aprobación'}</h1>
        <p className="text-steel">
          {rejected
            ? 'Un líder rechazó tu solicitud de ingreso. Si crees que es un error, habla con los líderes del grupo.'
            : 'Tu cuenta fue creada. Un líder debe aprobarla antes de que puedas ver la zona de miembros.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {!rejected && (
            <Button variant="secondary" onClick={check} disabled={checking}>
              {checking ? 'Comprobando…' : 'Comprobar de nuevo'}
            </Button>
          )}
          <Button variant="ghost" onClick={leave}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  )
}
