import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase, type Profile } from '../lib/supabase'

type SignUpInput = { email: string; password: string; fullName: string; nickname: string }

type AuthValue = {
  session: Session | null
  profile: Profile | null
  /** true mientras se resuelve la sesión inicial o el perfil */
  loading: boolean
  profileError: boolean
  isLeader: boolean
  isApproved: boolean
  signIn(email: string, password: string): Promise<void>
  /** `needsConfirmation` es true cuando la cuenta debe confirmar el correo antes de entrar */
  signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>
  resendConfirmation(email: string): Promise<void>
  signOut(): Promise<void>
  refreshProfile(): Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle()
      if (error) throw error
      return data
    },
  })

  const value = useMemo<AuthValue>(() => {
    const profile = profileQuery.data ?? null
    const isApproved = profile?.status === 'approved'
    return {
      session,
      profile,
      loading: !ready || (!!userId && profileQuery.isPending),
      profileError: profileQuery.isError,
      isApproved,
      isLeader: isApproved && profile?.role === 'leader',
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp({ email, password, fullName, nickname }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, nickname } },
        })
        if (error) throw error
        // Sin sesión: el proyecto exige confirmar el correo (así está en la nube)
        return { needsConfirmation: !data.session }
      },
      async resendConfirmation(email) {
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        if (error) throw error
      },
      async signOut() {
        await supabase.auth.signOut()
        queryClient.clear()
      },
      async refreshProfile() {
        await profileQuery.refetch()
      },
    }
  }, [session, ready, userId, profileQuery, queryClient])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}
