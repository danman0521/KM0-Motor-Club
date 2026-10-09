import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Motorcycle } from '../motorcycles/api'

export type DirectoryMember = {
  profile_id: string
  full_name: string
  nickname: string | null
  avatar_path: string | null
  city: string
  occupation: string
  phone: string
  birth_month: number | null
  birth_day: number | null
  motorcycles: Motorcycle[]
}

/** Enlace de WhatsApp a partir de un teléfono; null si no hay dígitos. */
export function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

/** Directorio de miembros aprobados con sus motos. */
export function useDirectory() {
  return useQuery({
    queryKey: ['directory'],
    queryFn: async (): Promise<DirectoryMember[]> => {
      const [members, motos] = await Promise.all([
        supabase.rpc('member_directory'),
        supabase.from('motorcycles').select('*'),
      ])
      if (members.error) throw members.error
      if (motos.error) throw motos.error

      const byProfile = new Map<string, Motorcycle[]>()
      for (const moto of motos.data) {
        byProfile.set(moto.profile_id, [...(byProfile.get(moto.profile_id) ?? []), moto])
      }
      return members.data.map((m) => ({ ...m, motorcycles: byProfile.get(m.profile_id) ?? [] }))
    },
  })
}
