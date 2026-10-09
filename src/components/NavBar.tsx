import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { site } from '../config/site'
import { displayName } from '../lib/supabase'
import { Avatar } from './Avatar'

const memberLinks = [
  { to: '/eventos', label: 'Eventos' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/destacado', label: 'Destacado' },
  { to: '/sugerencias', label: 'Sugerencias' },
  { to: '/convenios', label: 'Convenios' },
  { to: '/directorio', label: 'Directorio' },
  { to: '/anuncios', label: 'Anuncios' },
]

export function NavBar() {
  const { session, profile, isApproved, isLeader, signOut } = useAuth()
  const { pathname } = useLocation()
  // El menú móvil queda abierto solo en la página donde se abrió: al navegar se cierra
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null)
  const navigate = useNavigate()

  const links = [
    ...(isApproved ? memberLinks : []),
    ...(isLeader ? [{ to: '/lider', label: 'Panel de líderes' }] : []),
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
      isActive ? 'bg-red text-ink' : 'text-steel hover:bg-surface-2 hover:text-ink'
    }`

  async function handleSignOut() {
    setOpen(false)
    // Primero a la portada: si no, la guarda de la zona privada redirige a /ingresar
    navigate('/')
    await signOut()
  }

  const account = session ? (
    <>
      {isApproved ? (
        <Link
          to="/perfil"
          onClick={() => setOpen(false)}
          title="Mi perfil"
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-steel hover:bg-surface-2 hover:text-ink"
        >
          <Avatar profile={profile} size="sm" />
          {displayName(profile)}
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-muted">{displayName(profile)}</span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-line px-3 py-2 text-left text-sm font-semibold hover:bg-surface-2"
      >
        Salir
      </button>
    </>
  ) : (
    <>
      <NavLink to="/ingresar" className={linkClass} onClick={() => setOpen(false)}>
        Ingresar
      </NavLink>
      <NavLink to="/registro" className={linkClass} onClick={() => setOpen(false)}>
        Registrarse
      </NavLink>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-surface-2 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={site.logo} alt="" className="h-11 w-11 rounded-full" />
          <span className="font-display text-2xl font-bold uppercase tracking-wider text-red-hover">{site.name}</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <span className="mx-2 h-6 w-px bg-line" />
          {account}
        </nav>

        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 lg:hidden"
          aria-label="Menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
        </button>
      </div>

      {open && (
        <nav aria-label="Principal móvil" className="flex flex-col gap-1 border-t border-surface-2 px-4 py-3 lg:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {account}
        </nav>
      )}
    </header>
  )
}
