// Participación de los miembros en un evento: asistencia, calificaciones y comentarios.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const PROFILE = 'id, full_name, nickname, avatar_path'

// --- Asistencia --------------------------------------------------------------

export function useAttendance(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-attendance', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`status, updated_at, profile:profiles(${PROFILE})`)
        .eq('event_id', eventId!)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useSetAttendance(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (status: 'going' | 'not_going') => {
      const { error } = await supabase.from('event_attendance').upsert({ event_id: eventId, status })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-counts'] })
    },
  })
}

/** Cuántos van a cada evento, para las listas. */
export function useGoingCounts() {
  return useQuery({
    queryKey: ['attendance-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_attendance').select('event_id').eq('status', 'going')
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data) counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
      return counts
    },
  })
}

// --- Calificaciones ----------------------------------------------------------

export function summarizeRatings(stars: number[]): { average: number; count: number } {
  if (!stars.length) return { average: 0, count: 0 }
  return { average: stars.reduce((sum, s) => sum + s, 0) / stars.length, count: stars.length }
}

export function useRatings(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-ratings', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.from('event_ratings').select('profile_id, stars').eq('event_id', eventId!)
      if (error) throw error
      return data
    },
  })
}

export function useSetRating(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stars: number) => {
      const { error } = await supabase.from('event_ratings').upsert({ event_id: eventId, stars })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-ratings'] })
      queryClient.invalidateQueries({ queryKey: ['rating-summaries'] })
    },
  })
}

/** Promedio y número de votos por evento, para las listas. */
export function useRatingSummaries() {
  return useQuery({
    queryKey: ['rating-summaries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_ratings').select('event_id, stars')
      if (error) throw error
      const byEvent: Record<string, number[]> = {}
      for (const row of data) (byEvent[row.event_id] ??= []).push(row.stars)
      return Object.fromEntries(Object.entries(byEvent).map(([id, stars]) => [id, summarizeRatings(stars)]))
    },
  })
}

// --- Comentarios -------------------------------------------------------------

export function useComments(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-comments', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`id, body, created_at, author_id, author:profiles(${PROFILE})`)
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export type CommentWithAuthor = NonNullable<ReturnType<typeof useComments>['data']>[number]

export function useAddComment(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('event_comments').insert({ event_id: eventId, body })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] }),
  })
}

export function useDeleteComment(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] }),
  })
}
