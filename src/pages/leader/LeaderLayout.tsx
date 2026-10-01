import { NavLink, Outlet } from 'react-router-dom'
import { PageTitle } from '../../components/ui'

const tabs = [
  { to: 'miembros', label: 'Miembros' },
  { to: 'eventos', label: 'Eventos' },
  { to: 'destacado', label: 'Destacado' },
  { to: 'sugerencias', label: 'Sugerencias' },
  { to: 'convenios', label: 'Convenios' },
]

export function LeaderLayout() {
  return (
    <>
      <PageTitle>Panel de líderes</PageTitle>
      <nav aria-label="Panel de líderes" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `rounded-md px-4 py-2 font-display text-sm uppercase tracking-wide ${
                isActive ? 'bg-navy text-ink' : 'border border-line text-steel hover:bg-surface-2'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
