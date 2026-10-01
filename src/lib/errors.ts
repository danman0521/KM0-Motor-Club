type MaybeError = { message?: string; code?: string; name?: string }

/** Error cuyo mensaje ya está pensado para mostrarse al usuario. */
export class UserError extends Error {}

/** Convierte un error de red o de Supabase en un mensaje claro y no técnico. */
export function friendlyError(e: unknown): string {
  if (e instanceof UserError) return e.message
  const err = (e ?? {}) as MaybeError
  const message = (err.message ?? '').toLowerCase()

  if (message.includes('failed to fetch') || message.includes('networkerror') || err.name === 'AuthRetryableFetchError') {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
  }
  if (message.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo.'
  }
  if (message.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (message.includes('unable to validate email') || message.includes('invalid email') || message.includes('is invalid')) {
    return 'El correo no es válido.'
  }
  if (message.includes('rate limit')) return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  if (message.includes('mime type') || message.includes('not supported')) return 'Ese tipo de archivo no está permitido.'
  if (message.includes('exceeded the maximum allowed size')) return 'El archivo es demasiado grande.'
  if (err.code === '42501' || message.includes('row-level security')) return 'No tienes permiso para hacer esto.'
  if (err.code === '23505') return 'Ya existe un registro igual.'
  if (err.code === 'P0002') return 'La sugerencia no existe o ya fue revisada.'

  return 'Algo salió mal. Intenta de nuevo.'
}
