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

/**
 * Guarda (crea o edita) una moto. Si hay foto nueva: se sube, luego se escribe
 * la fila, y solo tras un guardado exitoso se borra la foto antigua. Si el
 * guardado falla, se limpia la foto recién subida para no dejarla huérfana.
 */
export async function saveMotorcycle(userId: string, { id, input }: { id?: string; input: MotorcycleInput }): Promise<void> {
  const { photo, ...fields } = input

  let oldPhotoPath: string | null = null
  if (id) {
    const { data: current, error } = await supabase.from('motorcycles').select('photo_path').eq('id', id).single()
    if (error) throw error
    oldPhotoPath = current?.photo_path ?? null
  }

  let newPhotoPath: string | null = null
  if (photo) {
    const compressed = await compressPhoto(photo)
    const path = `${userId}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
    if (error) throw error
    newPhotoPath = path
  }

  try {
    if (id) {
      // Sin foto nueva no se toca photo_path (conserva la existente)
      const row = newPhotoPath ? { ...fields, photo_path: newPhotoPath } : fields
      const { error } = await supabase.from('motorcycles').update(row).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('motorcycles').insert({ ...fields, photo_path: newPhotoPath })
      if (error) throw error
    }
  } catch (err) {
    if (newPhotoPath) await supabase.storage.from(BUCKET).remove([newPhotoPath])
    throw err
  }

  // El guardado funcionó: ya se puede retirar la foto reemplazada
  if (newPhotoPath && oldPhotoPath) await supabase.storage.from(BUCKET).remove([oldPhotoPath])
}

export function useSaveMotorcycle(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { id?: string; input: MotorcycleInput }) => saveMotorcycle(userId, args),
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
