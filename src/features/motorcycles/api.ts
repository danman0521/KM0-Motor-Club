import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '../../lib/database.types'
import { compressPhoto } from '../../lib/images'
import { supabase } from '../../lib/supabase'

const BUCKET = 'motorcycles'

export type Motorcycle = Tables<'motorcycles'>

export type MotorcycleInput = {
  brand: string
  model: string
  year: number | null
  displacement_cc: number | null
  color: string
  plate: string
  /** Foto nueva; null conserva la actual */
  photo: File | null
}

export function motorcyclePhotoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function useMotorcycles(profileId: string | undefined) {
  return useQuery({
    queryKey: ['motorcycles', profileId],
    enabled: !!profileId,
    queryFn: async (): Promise<Motorcycle[]> => {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('profile_id', profileId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useSaveMotorcycle(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: MotorcycleInput }) => {
      const { photo, ...fields } = input
      let photoPath: string | null | undefined
      if (id) {
        const { data: current } = await supabase.from('motorcycles').select('photo_path').eq('id', id).single()
        photoPath = current?.photo_path ?? null
      }
      if (photo) {
        const compressed = await compressPhoto(photo)
        const path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
        if (error) throw error
        const previous = photoPath
        photoPath = path
        if (previous) await supabase.storage.from(BUCKET).remove([previous])
      }

      if (id) {
        const row = photoPath !== undefined ? { ...fields, photo_path: photoPath } : fields
        const { error } = await supabase.from('motorcycles').update(row).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('motorcycles').insert({ ...fields, photo_path: photoPath ?? null })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', userId] })
      queryClient.invalidateQueries({ queryKey: ['directory'] })
    },
  })
}

export function useDeleteMotorcycle(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (moto: Motorcycle) => {
      const { error } = await supabase.from('motorcycles').delete().eq('id', moto.id)
      if (error) throw error
      if (moto.photo_path) await supabase.storage.from(BUCKET).remove([moto.photo_path])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', userId] })
      queryClient.invalidateQueries({ queryKey: ['directory'] })
    },
  })
}
