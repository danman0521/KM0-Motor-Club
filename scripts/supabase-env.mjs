// Lee la URL y las claves del Supabase local a partir de `supabase status`.
import { execSync } from 'node:child_process'

export function readSupabaseEnv() {
  let raw
  try {
    raw = execSync('npx supabase status -o json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    throw new Error('Supabase local no está corriendo. Ejecuta primero: npm run db:start')
  }
  const status = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1))
  const url = status.API_URL
  const anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY
  const serviceKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY
  if (!url || !anonKey || !serviceKey) {
    throw new Error('No se pudieron leer la URL o las claves de `supabase status`.')
  }
  return { url, anonKey, serviceKey }
}
