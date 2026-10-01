import { useMutation, useQueryClient } from '@tanstack/react-query'
import { compressPhoto } from '../../lib/images'
import { supabase } from '../../lib/supabase'

const BUCKET = 'avatars'

export function avatarUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Tras cambiar el perfil se refresca todo lo que muestra nombres o fotos de miembros. */
function useInvalidateProfiles() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      ['profile', 'members', 'event-comments', 'event-attendance', 'suggestions', 'featured'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
}

export function useUpdateProfile(userId: string) {
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: async ({ fullName, nickname }: { fullName: string; nickname: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, nickname: nickname || null })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Sube la foto a la carpeta del usuario, la guarda en su perfil y borra la anterior. */
export function useUploadAvatar(userId: string) {
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: async ({ file, previousPath }: { file: File; previousPath: string | null }) => {
      const compressed = await compressPhoto(file, { maxSide: 512, maxSizeMB: 0.15 })
      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { error } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId)
      if (error) {
        await supabase.storage.from(BUCKET).remove([path])
        throw error
      }
      if (previousPath) await supabase.storage.from(BUCKET).remove([previousPath])
    },
    onSuccess: invalidate,
  })
}

export function useRemoveAvatar(userId: string) {
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', userId)
      if (error) throw error
      await supabase.storage.from(BUCKET).remove([path])
    },
    onSuccess: invalidate,
  })
}
