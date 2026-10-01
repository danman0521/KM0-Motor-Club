import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { compressPhoto } from '../../lib/images'
import { supabase, type EventPhoto, type EventRow } from '../../lib/supabase'

const BUCKET = 'event-photos'
const SIGNED_URL_SECONDS = 60 * 60

export type EventInput = {
  title: string
  description: string
  location: string
  starts_at: string
  chronicle: string | null
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', id],
    enabled: !!id,
    queryFn: async (): Promise<EventRow | null> => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id!).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) throw error
  const urls: Record<string, string> = {}
  for (const item of data) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}

/** URL firmadas (temporales) para un conjunto de fotos del bucket privado. */
export function useSignedUrls(paths: string[]) {
  const key = [...paths].sort()
  return useQuery({
    queryKey: ['signed-urls', key],
    enabled: key.length > 0,
    staleTime: (SIGNED_URL_SECONDS / 2) * 1000,
    queryFn: () => signPaths(key),
  })
}

export type PhotoWithUrl = EventPhoto & { url: string | undefined }

export function useEventPhotos(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-photos', eventId],
    enabled: !!eventId,
    staleTime: (SIGNED_URL_SECONDS / 2) * 1000,
    queryFn: async (): Promise<PhotoWithUrl[]> => {
      const { data, error } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      const urls = await signPaths(data.map((p) => p.storage_path))
      return data.map((p) => ({ ...p, url: urls[p.storage_path] }))
    },
  })
}

export function useEventVideos(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-videos', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_videos')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useSaveEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: EventInput }): Promise<string> => {
      if (id) {
        const { error } = await supabase.from('events').update(input).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase.from('events').insert(input).select('id').single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      // La portada pública muestra los próximos eventos
      queryClient.invalidateQueries({ queryKey: ['public-home'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Los archivos no se borran en cascada con la fila: se quitan primero
      const { data: photos, error: listError } = await supabase.from('event_photos').select('storage_path').eq('event_id', id)
      if (listError) throw listError
      if (photos.length) {
        const { error } = await supabase.storage.from(BUCKET).remove(photos.map((p) => p.storage_path))
        if (error) throw error
      }
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['public-home'] })
    },
  })
}

/** Comprime y sube una foto, y la registra en el evento. Devuelve su ruta. */
export async function uploadEventPhoto(eventId: string, file: File): Promise<string> {
  const compressed = await compressPhoto(file)
  const path = `${eventId}/${crypto.randomUUID()}.jpg`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg' })
  if (uploadError) throw uploadError
  const { error } = await supabase.from('event_photos').insert({ event_id: eventId, storage_path: path })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  return path
}

export function useDeletePhoto(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (photo: EventPhoto) => {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path])
      if (storageError) throw storageError
      const { error } = await supabase.from('event_photos').delete().eq('id', photo.id)
      if (error) throw error
      // Si era la portada, el evento se queda sin portada
      const { error: coverError } = await supabase
        .from('events')
        .update({ cover_photo_path: null })
        .eq('id', eventId)
        .eq('cover_photo_path', photo.storage_path)
      if (coverError) throw coverError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-photos', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useSetCover(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.from('events').update({ cover_photo_path: path }).eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useAddVideo(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ youtubeId, title }: { youtubeId: string; title: string }) => {
      const { error } = await supabase
        .from('event_videos')
        .insert({ event_id: eventId, youtube_id: youtubeId, title: title || null })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-videos', eventId] }),
  })
}

export function useDeleteVideo(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_videos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-videos', eventId] }),
  })
}
