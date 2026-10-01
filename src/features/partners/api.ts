import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '../../lib/database.types'
import { compressPhoto } from '../../lib/images'
import { supabase } from '../../lib/supabase'

const BUCKET = 'partners'

export type Partner = Tables<'partners'>

export type PartnerInput = {
  name: string
  category: string
  benefit: string
  description: string
  phone: string
  address: string
  website: string | null
  valid_until: string | null
  active: boolean
  /** Logo nuevo; si no se envía se conserva el actual */
  logo: File | null
}

export function partnerLogoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Un miembro recibe solo los activos y vigentes; un líder, todos. */
export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async (): Promise<Partner[]> => {
      const { data, error } = await supabase.from('partners').select('*').order('category').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useSavePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ current, input }: { current?: Partner; input: PartnerInput }) => {
      const { logo, ...fields } = input
      let logoPath = current?.logo_path ?? null
      if (logo) {
        const compressed = await compressPhoto(logo, { maxSide: 600, maxSizeMB: 0.15 })
        const path = `${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
        if (error) throw error
        logoPath = path
      }

      const row = { ...fields, logo_path: logoPath }
      const { error } = current
        ? await supabase.from('partners').update(row).eq('id', current.id)
        : await supabase.from('partners').insert(row)
      if (error) throw error

      // El logo anterior ya no se usa
      if (logo && current?.logo_path) await supabase.storage.from(BUCKET).remove([current.logo_path])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  })
}

export function useSetPartnerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('partners').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (partner: Partner) => {
      const { error } = await supabase.from('partners').delete().eq('id', partner.id)
      if (error) throw error
      if (partner.logo_path) await supabase.storage.from(BUCKET).remove([partner.logo_path])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  })
}
