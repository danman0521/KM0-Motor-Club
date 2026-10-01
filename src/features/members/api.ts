import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Profile } from '../../lib/supabase'

/** Todos los perfiles visibles: un líder ve todos; un miembro solo los aprobados. */
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useSetMemberStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Profile['status'] }) => {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useSetMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Profile['role'] }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })
}
