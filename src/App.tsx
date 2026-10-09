import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAccess } from './auth/guards'
import { PendingGate } from './auth/PendingGate'
import { Layout } from './components/Layout'
import { CalendarPage } from './pages/CalendarPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { FeaturedPage } from './pages/FeaturedPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { FichaPage } from './pages/FichaPage'
import { GaragePage } from './pages/GaragePage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PartnersPage } from './pages/PartnersPage'
import { PendingPage } from './pages/PendingPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SuggestionsPage } from './pages/SuggestionsPage'
import { LeaderEventEditPage } from './pages/leader/LeaderEventEditPage'
import { LeaderEventsPage } from './pages/leader/LeaderEventsPage'
import { LeaderFeaturedPage } from './pages/leader/LeaderFeaturedPage'
import { LeaderLayout } from './pages/leader/LeaderLayout'
import { LeaderMembersPage } from './pages/leader/LeaderMembersPage'
import { LeaderPartnersPage } from './pages/leader/LeaderPartnersPage'
import { LeaderSuggestionsPage } from './pages/leader/LeaderSuggestionsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Con sesión sin aprobar, todo redirige a la pantalla de espera */}
        <Route element={<PendingGate />}>
          <Route index element={<HomePage />} />
          <Route path="ingresar" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />
          <Route path="pendiente" element={<PendingPage />} />

          <Route element={<RequireAccess need="approved" />}>
            <Route path="eventos" element={<EventsPage />} />
            <Route path="eventos/:id" element={<EventDetailPage />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="destacado" element={<FeaturedPage />} />
            <Route path="sugerencias" element={<SuggestionsPage />} />
            <Route path="convenios" element={<PartnersPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="ficha" element={<FichaPage />} />
            <Route path="garaje" element={<GaragePage />} />
            <Route path="directorio" element={<DirectoryPage />} />
          </Route>

          <Route element={<RequireAccess need="leader" />}>
            <Route path="lider" element={<LeaderLayout />}>
              <Route index element={<Navigate to="miembros" replace />} />
              <Route path="miembros" element={<LeaderMembersPage />} />
              <Route path="eventos" element={<LeaderEventsPage />} />
              <Route path="eventos/nuevo" element={<LeaderEventEditPage />} />
              <Route path="eventos/:id" element={<LeaderEventEditPage />} />
              <Route path="destacado" element={<LeaderFeaturedPage />} />
              <Route path="sugerencias" element={<LeaderSuggestionsPage />} />
              <Route path="convenios" element={<LeaderPartnersPage />} />
          </Route>
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
