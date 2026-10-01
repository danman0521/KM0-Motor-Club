import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { site } from '../config/site'
import { NavBar } from './NavBar'
import { SocialLinks } from './SocialLinks'

export function Layout() {
  const { pathname } = useLocation()

  // Cada página nueva empieza arriba
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="space-y-3 border-t border-surface-2 px-4 py-6 text-center text-sm text-muted">
        <SocialLinks size="sm" />
        <p>
          {site.name} · {site.tagline}
        </p>
      </footer>
    </div>
  )
}
