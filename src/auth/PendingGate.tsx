import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { pendingRedirect } from './access'
import { useAuth } from './AuthProvider'

/** Una cuenta con sesión pero sin aprobar solo puede ver la pantalla de espera. */
export function PendingGate() {
  const { session, profile, loading } = useAuth()
  const { pathname } = useLocation()

  if (!loading) {
    const target = pendingRedirect({ hasSession: !!session, profile }, pathname)
    if (target) return <Navigate to={target} replace />
  }
  return <Outlet />
}
