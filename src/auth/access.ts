export type AccessState = {
  hasSession: boolean
  profile: { role: 'member' | 'leader'; status: 'pending' | 'approved' | 'rejected' } | null
}

export type AccessResult = 'ok' | '/ingresar' | '/pendiente' | '/eventos'

/** Decide si se puede entrar a una ruta protegida o a dónde redirigir. */
export function resolveAccess(state: AccessState, need: 'approved' | 'leader'): AccessResult {
  if (!state.hasSession) return '/ingresar'
  if (state.profile?.status !== 'approved') return '/pendiente'
  if (need === 'leader' && state.profile.role !== 'leader') return '/eventos'
  return 'ok'
}
