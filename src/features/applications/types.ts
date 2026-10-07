// Tipos y constantes del formulario, sin dependencia de Supabase (así los
// componentes se pueden probar sin conexión configurada).
import type { Enums } from '../../lib/database.types'

export type BloodType = Enums<'blood_type'>
export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export type ApplicationInput = {
  city: string
  occupation: string
  birth_date: string
  phone: string
  other_club: string
  blood_type: BloodType
  allergies: string
  medical_conditions: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

export type ApplicationSubmission = {
  input: ApplicationInput
  /** Foto de perfil nueva (va al bucket de avatars); null conserva la actual */
  riderPhoto: File | null
  /** Foto de la moto nueva; null conserva la actual */
  motoPhoto: File | null
}
