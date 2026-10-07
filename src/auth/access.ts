export type AccessState = {
  hasSession: boolean
  profile: { role: 'member' | 'leader'; status: 'pending' | 'approved' | 'rejected' } | null
}

export type AccessResult = 'ok' | '/ingresar' | '/pendiente' | '/eventos'

/**
 * Con sesión pero sin aprobación, la única página visible es la de espera.
 * Devuelve la ruta a la que redirigir, o null si se puede quedar.
 */
export function pendingRedirect(state: AccessState, pathname: string): '/pendiente' | null {
  if (!state.hasSession || !state.profile) return null
  if (state.profile.status === 'approved') return null
  return pathname === '/pendiente' ? null : '/pendiente'
}

/** Decide si se puede entrar a una ruta protegida o a dónde redirigir. */
export function resolveAccess(state: AccessState, need: 'approved' | 'leader'): AccessResult {
  if (!state.hasSession) return '/ingresar'
  if (state.profile?.status !== 'approved') return '/pendiente'
  if (need === 'leader' && state.profile.role !== 'leader') return '/eventos'
  return 'ok'
}
