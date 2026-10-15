import { createClient } from '@supabase/supabase-js'
import type { Database, Enums, Tables } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error('Falta .env.local. Ejecuta `npm run db:start` y luego `npm run db:env`.')
}

export const supabase = createClient<Database>(url, anonKey)

export type Profile = Tables<'profiles'>
export type EventRow = Tables<'events'>
export type EventPhoto = Tables<'event_photos'>
export type EventVideo = Tables<'event_videos'>
export type FeaturedRider = Tables<'featured_riders'>
export type Suggestion = Tables<'suggestions'>

/** Nombre a mostrar de un miembro: apodo si tiene, si no su nombre. */
export function displayName(p: Pick<Profile, 'full_name' | 'nickname'> | null | undefined): string {
  if (!p) return 'Miembro'
  return p.nickname || p.full_name
}

export type RideRole = Enums<'ride_role'>
export const RIDE_ROLES: RideRole[] = ['piloto', 'copiloto']

/** Etiqueta para mostrar el rol de rodada (piloto/copiloto). */
export function rideRoleLabel(role: RideRole | null | undefined): string {
  if (role === 'piloto') return 'Piloto'
  if (role === 'copiloto') return 'Copiloto'
  return ''
}
