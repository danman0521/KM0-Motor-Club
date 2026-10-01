# Plataforma Neutro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plataforma web local para el grupo de moteros Neutro: portada pública, zona privada de miembros (eventos, calendario, destacado, sugerencias) y panel de líderes.

**Architecture:** SPA en React que habla directo con Supabase local (Auth, Postgres con RLS, Storage). Los permisos viven en la base de datos; la interfaz solo los refleja. Cada feature separa consultas (`api.ts`) de componentes.

**Tech Stack:** Vite + React 19 + TypeScript, React Router (HashRouter), Tailwind CSS 4, TanStack Query 5, supabase-js 2, Supabase CLI (Docker), Vitest + Testing Library.

Spec: `docs/superpowers/specs/2026-10-01-plataforma-neutro-design.md`

## Global Constraints

- Todo corre en local; no se despliega nada ni se crea ninguna cuenta en la nube.
- Textos de la interfaz en español.
- HashRouter (rutas `/#/...`).
- Colores solo mediante tokens del tema: fondo `#020202`, superficies `#171718` / `#272728`, bordes `#575758`, texto secundario `#868688`, texto `#FCFCFC`, rojo `#AB1516` (hover `#C73032`, oscuro `#770B0E`), azul `#263355` (oscuro `#1A223B`), acero `#B4BACC`, crema `#CEB98B`.
- Las páginas no llaman a Supabase directamente: usan los `api.ts` de cada feature.
- Fotos: solo imágenes, comprimidas en el navegador (lado mayor 1600 px, objetivo 300 KB). Videos: solo id de YouTube validado.
- Un usuario nunca puede cambiar su propio `role` o `status`; un líder no puede quitarse a sí mismo el liderazgo.
- Credenciales de prueba solo en `scripts/seed.mjs` (válidas únicamente en local).

## File Structure

```
package.json, vite.config.ts, index.html, .env.example, README.md
public/logo-neutro.webp, public/favicon.png
supabase/config.toml
supabase/migrations/20261001000000_init.sql      esquema, RLS, funciones, buckets
scripts/seed.mjs                                 líder inicial y datos de ejemplo
scripts/supabase-env.mjs                         lee URL y claves de `supabase status`
src/main.tsx, src/App.tsx (rutas), src/index.css (tokens del tema)
src/config/site.ts                               nombre, lema, texto de portada
src/lib/supabase.ts, database.types.ts, youtube.ts, dates.ts, images.ts, errors.ts
src/auth/AuthProvider.tsx, access.ts, guards.tsx
src/features/events/api.ts, EventCard.tsx, EventForm.tsx, PhotoGallery.tsx, PhotoManager.tsx, VideoManager.tsx
src/features/calendar/MonthGrid.tsx
src/features/featured/api.ts, FeaturedCard.tsx, FeaturedForm.tsx
src/features/suggestions/api.ts, SuggestionForm.tsx, SuggestionList.tsx
src/features/members/api.ts
src/components/Layout.tsx, NavBar.tsx, ui.tsx (Button, Card, Field, Badge, Spinner, ErrorNote, EmptyState, Modal)
src/pages/HomePage, LoginPage, RegisterPage, PendingPage, EventsPage, EventDetailPage,
          CalendarPage, FeaturedPage, SuggestionsPage,
          leader/LeaderLayout, LeaderMembersPage, LeaderEventsPage, LeaderEventEditPage,
          LeaderFeaturedPage, LeaderSuggestionsPage
tests/rls/rls.test.ts                            permisos contra Supabase local
src/**/*.test.ts(x)                              unitarias y de componentes
```

---

### Task 1: Scaffold, tema y Supabase local

**Files:** `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/index.css`, `src/config/site.ts`, `public/*`, `supabase/config.toml`, `.env.example`

**Produces:** scripts `dev`, `build`, `test`, `test:rls`, `db:start`, `db:stop`, `db:reset`, `db:seed`, `db:types`; tokens Tailwind `bg`, `surface`, `surface-2`, `line`, `muted`, `ink`, `red`, `red-hover`, `red-dark`, `navy`, `navy-dark`, `steel`, `cream`; fuentes `font-display` (Oswald) y `font-sans` (Inter).

- [ ] `npm create vite@latest` (plantilla react-ts) en la raíz; instalar dependencias de runtime y de desarrollo.
- [ ] Configurar Tailwind 4 (`@tailwindcss/vite`) y declarar los tokens en `@theme` dentro de `src/index.css`.
- [ ] Copiar el logo a `public/` y generar `favicon.png`.
- [ ] `npx supabase init`; en `config.toml`: `site_url = "http://localhost:5173"`, confirmación de correo desactivada.
- [ ] `db:start` = `supabase start -x realtime,edge-runtime,logflare,vector,imgproxy,supavisor`.
- [ ] Verificar: `npm run build` compila y `npm run db:start` deja Supabase arriba.
- [ ] Commit.

### Task 2: Esquema, RLS, funciones y buckets

**Files:** `supabase/migrations/20261001000000_init.sql`, `tests/rls/rls.test.ts`, `scripts/supabase-env.mjs`, `vitest.rls.config.ts`

**Produces (base de datos):**
- Tipos `member_role`, `member_status`, `suggestion_status`.
- Tablas `profiles`, `events`, `event_photos`, `event_videos`, `featured_riders`, `suggestions` (columnas según la sección 6 de la spec).
- `is_approved()`, `is_leader()` (security definer, `search_path = ''`).
- Trigger `on_auth_user_created` → crea perfil `member` + `pending` con `full_name` y `nickname` de los metadatos.
- Trigger `protect_profile_fields` → ignora cambios de `role`/`status` hechos por no líderes; lanza error si un líder se quita a sí mismo liderazgo o aprobación.
- RPC `public_upcoming_events()` → `(title, starts_at, location)`; `public_current_featured()` → `(display_name, reason, photo_path, month)`; ambas ejecutables por `anon`.
- RPC `create_event_from_suggestion(p_suggestion uuid, p_title text, p_description text, p_location text, p_starts_at timestamptz) returns uuid` → crea el evento y marca la sugerencia `approved` con `event_id`, en una transacción; solo líderes.
- Buckets `event-photos` (privado) y `featured` (público), 5 MB, solo imágenes, con políticas en `storage.objects`.

- [ ] Escribir `tests/rls/rls.test.ts` (falla: no hay esquema). Casos:
  - anónimo: no lee `events`, `profiles`, `suggestions`, `featured_riders`; sí obtiene `public_upcoming_events` (máx. 3, solo futuros) y `public_current_featured`.
  - pendiente: lee solo su perfil; no lee eventos; no puede postular; no puede aprobarse ni hacerse líder.
  - miembro: lee eventos, fotos, videos, destacados, sugerencias y perfiles aprobados (no los pendientes); crea sugerencia propia `pending`; no puede crearla ya aprobada ni a nombre de otro; no escribe eventos; no puede hacerse líder; no cambia el estado de una sugerencia; no sube fotos; sí obtiene URL firmada de una foto.
  - líder: CRUD de eventos, fotos, videos, destacado; aprueba miembros; nombra líder; no puede degradarse a sí mismo; `create_event_from_suggestion` crea evento y enlaza; sube y borra fotos.
  - miembro llama `create_event_from_suggestion` → error.
- [ ] Escribir la migración; `npm run db:reset`; `npm run test:rls` en verde.
- [ ] `npm run db:types` genera `src/lib/database.types.ts`.
- [ ] Commit.

### Task 3: Utilidades puras (TDD)

**Files:** `src/lib/youtube.ts`, `src/lib/dates.ts`, `src/auth/access.ts` + sus `.test.ts`

**Produces:**
- `parseYouTubeId(input: string): string | null` — acepta `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`, con o sin `www.`/`m.` y parámetros extra; rechaza otros dominios e ids que no sean 11 caracteres `[A-Za-z0-9_-]`.
- `youTubeEmbedUrl(id: string): string` → `https://www.youtube-nocookie.com/embed/<id>`.
- `buildMonthGrid(year: number, monthIndex: number): Date[][]` — semanas de lunes a domingo que cubren el mes.
- `isPast(startsAt: string, now?: Date): boolean`, `isSameDay(a: Date, b: Date): boolean`, `monthStart(d: Date): string` (`YYYY-MM-01`), `formatEventDate(iso: string): string`, `formatMonth(isoDate: string): string`, `toLocalInputValue(iso: string): string`.
- `resolveAccess(state: { hasSession: boolean; profile: Pick<Profile,'role'|'status'> | null }, need: 'approved' | 'leader'): 'ok' | '/ingresar' | '/pendiente' | '/eventos'`.

- [ ] Tests primero, verlos fallar, implementar, verlos pasar. Commit.

### Task 4: Autenticación y armazón

**Files:** `src/lib/supabase.ts`, `src/lib/errors.ts`, `src/auth/AuthProvider.tsx`, `src/auth/guards.tsx`, `src/components/*`, `src/App.tsx`, `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `PendingPage.tsx`

**Produces:**
- `supabase` (cliente tipado con `Database`).
- `useAuth(): { session, profile, loading, signIn(email, password), signUp({ email, password, fullName, nickname }), signOut() }`.
- `<RequireApproved>` y `<RequireLeader>`: usan `resolveAccess`; recuerdan la ruta de origen para volver tras ingresar.
- `friendlyError(e: unknown): string` — mensaje en español, no técnico.
- `ui.tsx`: `Button`, `Card`, `Field`, `Badge`, `Spinner`, `ErrorNote`, `EmptyState`, `Modal`.
- `NavBar` con entradas según rol y menú desplegable en celular.

- [ ] Implementar; test de componente de `RegisterPage` (validación de campos obligatorios).
- [ ] Verificar en navegador: registrar cuenta → cae en `/pendiente`. Commit.

### Task 5: Seed

**Files:** `scripts/seed.mjs`

- [ ] Con la clave de servicio local: un líder, dos miembros aprobados, uno pendiente, dos eventos pasados (con crónica y video), dos futuros, destacado del mes actual y del anterior, tres sugerencias (una por estado). Idempotente (no duplica si ya existe).
- [ ] `npm run db:seed`; ingresar como líder en el navegador. Commit.

### Task 6: Eventos y calendario (zona de miembros)

**Files:** `src/features/events/api.ts`, `EventCard.tsx`, `PhotoGallery.tsx`, `src/features/calendar/MonthGrid.tsx`, `src/pages/EventsPage.tsx`, `EventDetailPage.tsx`, `CalendarPage.tsx`

**Produces (`events/api.ts`):** `useEvents()`, `useEvent(id)`, `useEventPhotos(eventId)` (con URL firmadas), `useEventVideos(eventId)`, `useSignedCovers(paths)`, y mutaciones `useSaveEvent()`, `useDeleteEvent()`, `useUploadPhotos()`, `useDeletePhoto()`, `useSetCover()`, `useAddVideo()`, `useDeleteVideo()`.

- [ ] Lista de eventos pasados (más reciente primero), detalle con crónica, galería con visor y videos; calendario mensual con navegación y lista de próximos.
- [ ] Verificar en navegador como miembro. Commit.

### Task 7: Destacado y sugerencias (zona de miembros) + portada

**Files:** `src/features/featured/api.ts`, `FeaturedCard.tsx`, `src/features/suggestions/api.ts`, `SuggestionForm.tsx`, `SuggestionList.tsx`, `src/pages/FeaturedPage.tsx`, `SuggestionsPage.tsx`, `HomePage.tsx`

**Produces:** `useFeaturedRiders()`, `useSaveFeatured()`, `usePublicHome()` (las dos RPC públicas), `useSuggestions()`, `useCreateSuggestion()`, `useRejectSuggestion()`, `useApproveSuggestionAsEvent()`.

- [ ] Test de componente de `SuggestionForm` (título obligatorio; envía datos correctos; conserva lo escrito si falla).
- [ ] Implementar páginas; verificar portada sin sesión y zona privada como miembro. Commit.

### Task 8: Panel de líderes

**Files:** `src/features/members/api.ts`, `src/features/events/EventForm.tsx`, `PhotoManager.tsx`, `VideoManager.tsx`, `src/features/featured/FeaturedForm.tsx`, `src/lib/images.ts`, `src/pages/leader/*`

**Produces:** `useMembers()`, `useSetMemberStatus()`, `useSetMemberRole()`; `compressPhoto(file: File): Promise<File>`, `isImageFile(file: File): boolean`.

- [ ] Miembros: pendientes con Aprobar/Rechazar; lista con nombrar/quitar líder y revocar.
- [ ] Eventos: crear/editar/borrar; subida múltiple con progreso por foto (si una falla, las demás siguen); portada; videos por enlace.
- [ ] Destacado: mes, miembro, motivo, foto; uno por mes, editable.
- [ ] Sugerencias: rechazar con nota; aprobar abre `/lider/eventos/nuevo?sugerencia=<id>` precargado y usa `create_event_from_suggestion`.
- [ ] Test de componente de `EventForm` (campos obligatorios; precarga desde sugerencia).
- [ ] Commit.

### Task 9: Verificación de punta a punta y README

- [ ] Recorrido en navegador: registro → aprobación por líder → ver eventos → postular → aprobar → aparece en calendario y portada; subida de foto; vista en ancho de celular.
- [ ] `npm run test`, `npm run test:rls`, `npm run build` en verde.
- [ ] `README.md` con cómo ejecutar en local. Commit.
