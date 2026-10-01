import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ErrorNote, Spinner } from '../components/ui'
import { resolveAccess } from './access'
import { useAuth } from './AuthProvider'

/** Protege un grupo de rutas; redirige según sesión, aprobación y rol. */
export function RequireAccess({ need }: { need: 'approved' | 'leader' }) {
  const { session, profile, loading, profileError, refreshProfile } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Cargando…" />
  if (session && profileError) {
    return <ErrorNote message="No se pudo cargar tu perfil." onRetry={refreshProfile} />
  }

  const result = resolveAccess({ hasSession: !!session, profile }, need)
  if (result === 'ok') return <Outlet />

  return (
    <Navigate
      to={result}
      replace
      state={result === '/ingresar' ? { from: location.pathname + location.search } : undefined}
    />
  )
}
