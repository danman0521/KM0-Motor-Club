import { ageFrom, formatDayOf } from '../../lib/dates'
import { rideRoleLabel, supabase, type Profile } from '../../lib/supabase'
import type { Application } from '../applications/api'
import type { Motorcycle } from '../motorcycles/api'

export const EXPORT_HEADERS = [
  'Nombre',
  'Apodo',
  'Rol',
  'Estado',
  '¿Líder?',
  'Ciudad',
  'Ocupación',
  'Fecha de nacimiento',
  'Edad',
  'Celular',
  '¿Otro grupo?',
  'Tipo de sangre (RH)',
  'Alergias',
  'Condiciones médicas',
  'Contacto de emergencia (nombre)',
  'Contacto de emergencia (teléfono)',
  'Motos',
  'Registrado el',
]

const STATUS_LABEL: Record<Profile['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

/** Arma las filas del export (cabecera + una fila por miembro). Función pura. */
export function buildMemberRows(profiles: Profile[], applications: Application[], motorcycles: Motorcycle[]): string[][] {
  const appByProfile = new Map(applications.map((a) => [a.profile_id, a]))
  const motosByProfile = new Map<string, Motorcycle[]>()
  for (const m of motorcycles) {
    motosByProfile.set(m.profile_id, [...(motosByProfile.get(m.profile_id) ?? []), m])
  }

  const rows = profiles.map((p) => {
    const a = appByProfile.get(p.id)
    const motos = (motosByProfile.get(p.id) ?? []).map((m) => `${m.brand} ${m.model}`).join('; ')
    return [
      p.full_name,
      p.nickname ?? '',
      rideRoleLabel(p.ride_role),
      STATUS_LABEL[p.status],
      p.role === 'leader' ? 'Sí' : 'No',
      a?.city ?? '',
      a?.occupation ?? '',
      a?.birth_date ?? '',
      a?.birth_date ? String(ageFrom(a.birth_date)) : '',
      a?.phone ?? '',
      a?.other_club ?? '',
      a?.blood_type ?? '',
      a?.allergies ?? '',
      a?.medical_conditions ?? '',
      a?.emergency_contact_name ?? '',
      a?.emergency_contact_phone ?? '',
      motos,
      formatDayOf(p.created_at),
    ]
  })

  return [EXPORT_HEADERS, ...rows]
}

/** Trae todos los perfiles, fichas y motos (solo un líder puede) y arma las filas. */
export async function fetchMemberExportRows(): Promise<string[][]> {
  const [profiles, applications, motorcycles] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('applications').select('*'),
    supabase.from('motorcycles').select('*'),
  ])
  if (profiles.error) throw profiles.error
  if (applications.error) throw applications.error
  if (motorcycles.error) throw motorcycles.error
  return buildMemberRows(profiles.data, applications.data, motorcycles.data)
}
