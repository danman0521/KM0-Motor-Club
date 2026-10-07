import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enums, Tables } from '../../lib/database.types'
import { compressPhoto } from '../../lib/images'
import { supabase } from '../../lib/supabase'

const BUCKET = 'applications'
const SIGNED_URL_SECONDS = 60 * 60

export type Application = Tables<'applications'>
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

/** La ficha de un miembro; la propia o, para líderes, la de cualquiera. */
export function useApplication(profileId: string | undefined) {
  return useQuery({
    queryKey: ['application', profileId],
    enabled: !!profileId,
    queryFn: async (): Promise<Application | null> => {
      const { data, error } = await supabase.from('applications').select('*').eq('profile_id', profileId!).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Qué miembros ya enviaron su ficha, para marcarlo en las listas. */
export function useApplicationIds() {
  return useQuery({
    queryKey: ['application-ids'],
    queryFn: async () => {
      const { data, error } = await supabase.from('applications').select('profile_id')
      if (error) throw error
      return new Set(data.map((a) => a.profile_id))
    },
  })
}

/** URL temporal de la foto de la moto (bucket privado). */
export function useMotoPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['moto-photo', path],
    enabled: !!path,
    staleTime: (SIGNED_URL_SECONDS / 2) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path!, SIGNED_URL_SECONDS)
      if (error) throw error
      return data.signedUrl
    },
  })
}

export function useSaveApplication(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, riderPhoto, motoPhoto }: ApplicationSubmission) => {
      const { data: current, error: readError } = await supabase
        .from('applications')
        .select('moto_photo_path')
        .eq('profile_id', userId)
        .maybeSingle()
      if (readError) throw readError

      let motoPath = current?.moto_photo_path ?? null
      if (motoPhoto) {
        const compressed = await compressPhoto(motoPhoto)
        const path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
        if (error) throw error
        motoPath = path
      }

      const { error } = await supabase
        .from('applications')
        .upsert({ profile_id: userId, ...input, moto_photo_path: motoPath }, { onConflict: 'profile_id' })
      if (error) throw error

      if (motoPhoto && current?.moto_photo_path) {
        await supabase.storage.from(BUCKET).remove([current.moto_photo_path])
      }

      // La foto de la persona es su foto de perfil
      if (riderPhoto) {
        const { data: profile } = await supabase.from('profiles').select('avatar_path').eq('id', userId).single()
        const compressed = await compressPhoto(riderPhoto, { maxSide: 512, maxSizeMB: 0.15 })
        const path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error: upError } = await supabase.storage.from('avatars').upload(path, compressed, { contentType: 'image/jpeg' })
        if (upError) throw upError
        const { error: profileError } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId)
        if (profileError) throw profileError
        if (profile?.avatar_path) await supabase.storage.from('avatars').remove([profile.avatar_path])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', userId] })
      queryClient.invalidateQueries({ queryKey: ['application-ids'] })
      queryClient.invalidateQueries({ queryKey: ['moto-photo'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
