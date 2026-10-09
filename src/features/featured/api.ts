import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { compressPhoto } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import { avatarUrl } from '../profile/api'

const BUCKET = 'featured'

export function featuredPhotoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Foto a mostrar para el destacado: la foto específica del destacado si existe;
 * si no, la foto de perfil del motero.
 */
export function featuredDisplayPhoto(
  photoPath: string | null | undefined,
  avatarPath: string | null | undefined,
): string | undefined {
  return featuredPhotoUrl(photoPath) ?? avatarUrl(avatarPath)
}

export function useFeaturedRiders() {
  return useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_riders')
        .select('*, profile:profiles!featured_riders_profile_id_fkey(id, full_name, nickname, avatar_path)')
        .order('month', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export type FeaturedWithProfile = NonNullable<ReturnType<typeof useFeaturedRiders>['data']>[number]

export type FeaturedInput = {
  /** Primer día del mes, `YYYY-MM-01` */
  month: string
  profile_id: string
  reason: string
  /** Foto nueva; si no se envía se conserva la actual */
  photo: File | null
}

export function useSaveFeatured() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: FeaturedInput) => {
      const { data: existing, error: readError } = await supabase
        .from('featured_riders')
        .select('photo_path')
        .eq('month', input.month)
        .maybeSingle()
      if (readError) throw readError

      let photoPath = existing?.photo_path ?? null
      if (input.photo) {
        const compressed = await compressPhoto(input.photo)
        const path = `${input.month}-${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
        if (error) throw error
        photoPath = path
      }

      const { error } = await supabase
        .from('featured_riders')
        .upsert(
          { month: input.month, profile_id: input.profile_id, reason: input.reason, photo_path: photoPath },
          { onConflict: 'month' },
        )
      if (error) throw error

      // La foto anterior ya no se usa
      if (input.photo && existing?.photo_path) {
        await supabase.storage.from(BUCKET).remove([existing.photo_path])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured'] })
      queryClient.invalidateQueries({ queryKey: ['public-home'] })
    },
  })
}

export type PublicPastEvent = { title: string; starts_at: string; location: string; photoUrls: string[] }

/** Datos de la portada pública: no requieren sesión. */
export function usePublicHome() {
  return useQuery({
    queryKey: ['public-home'],
    queryFn: async () => {
      const [upcoming, featured, past] = await Promise.all([
        supabase.rpc('public_upcoming_events'),
        supabase.rpc('public_current_featured'),
        supabase.rpc('public_past_events'),
      ])
      if (upcoming.error) throw upcoming.error
      if (featured.error) throw featured.error
      if (past.error) throw past.error

      // Las fotos de la portada están en un bucket privado: se piden URL firmadas
      const paths = past.data.flatMap((e) => e.photos)
      const urls: Record<string, string> = {}
      if (paths.length) {
        const signed = await supabase.storage.from('event-photos').createSignedUrls(paths, 60 * 60)
        if (signed.error) throw signed.error
        for (const item of signed.data) {
          if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
        }
      }
      const pastEvents: PublicPastEvent[] = past.data.map((e) => ({
        title: e.title,
        starts_at: e.starts_at,
        location: e.location,
        photoUrls: e.photos.flatMap((p) => (urls[p] ? [urls[p]] : [])),
      }))

      return { upcoming: upcoming.data, featured: featured.data[0] ?? null, past: pastEvents }
    },
  })
}
