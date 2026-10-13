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

/** Borra la carpeta del usuario en un bucket. Best-effort: no interrumpe si falla. */
async function removeUserFolder(bucket: string, userId: string) {
  try {
    const { data } = await supabase.storage.from(bucket).list(userId)
    if (data?.length) {
      await supabase.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`))
    }
  } catch {
    // La cuenta ya se eliminó; dejar un archivo huérfano no es crítico.
  }
}

/**
 * Elimina por completo a un miembro: borra su cuenta y, en cascada, su perfil y
 * todos sus datos personales. Es irreversible y solo lo permite un líder (lo
 * valida la función `delete_member` en la base de datos). Después limpia sus
 * archivos (avatar, fotos de motos y de la ficha) con la Storage API.
 */
export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_member', { target: id })
      if (error) throw error
      await Promise.all([
        removeUserFolder('avatars', id),
        removeUserFolder('motorcycles', id),
        removeUserFolder('applications', id),
      ])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })
}
