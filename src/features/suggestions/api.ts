import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export type SuggestionInput = {
  title: string
  description: string
  tentative_date: string | null
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*, author:profiles!suggestions_proposed_by_fkey(full_name, nickname)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export type SuggestionWithAuthor = NonNullable<ReturnType<typeof useSuggestions>['data']>[number]

export function useCreateSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SuggestionInput) => {
      const { error } = await supabase.from('suggestions').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  })
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase
        .from('suggestions')
        .update({ status: 'rejected', leader_note: note.trim() || null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  })
}

/** Aprueba la sugerencia creando su evento; devuelve el id del evento. */
export function useApproveSuggestionAsEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      suggestionId: string
      title: string
      description: string
      location: string
      starts_at: string
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('create_event_from_suggestion', {
        p_suggestion: args.suggestionId,
        p_title: args.title,
        p_description: args.description,
        p_location: args.location,
        p_starts_at: args.starts_at,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['public-home'] })
    },
  })
}
