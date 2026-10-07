import { avatarUrl } from '../features/profile/api'

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-28 w-28 text-3xl' } as const

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Foto de perfil de un miembro; sin foto muestra sus iniciales. */
export function Avatar({
  profile,
  size = 'md',
}: {
  profile: { full_name: string; avatar_path?: string | null } | null | undefined
  size?: keyof typeof sizes
}) {
  const url = avatarUrl(profile?.avatar_path)
  const base = `${sizes[size]} shrink-0 rounded-full`
  if (url) return <img src={url} alt="" loading="lazy" className={`${base} object-cover`} />
  return (
    <span aria-hidden className={`${base} inline-flex items-center justify-center bg-gunmetal font-display font-semibold text-steel`}>
      {initials(profile?.full_name ?? '')}
    </span>
  )
}
