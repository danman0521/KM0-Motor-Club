# Garaje, ruta del evento, directorio, anuncios y cumpleaños — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir garaje de motos, punto de encuentro/mapa en eventos, directorio de miembros con teléfono, tablón de anuncios y cumpleaños del mes.

**Architecture:** Una migración nueva (tablas `motorcycles` y `announcements`, columnas en `events`, función `member_directory()`), features React con TanStack Query siguiendo el patrón `api.ts` + componentes, páginas nuevas y enlaces de navegación. Permisos en la base de datos (RLS), probados con `tests/rls`.

**Tech Stack:** Vite + React 19 + TS, TanStack Query, supabase-js, Supabase local (Docker), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-09-garaje-directorio-anuncios-design.md`

## Global Constraints

- Todo corre en local para desarrollo; la nube se actualiza aparte con `npx supabase db push --db-url` (session pooler `aws-1`).
- Textos de interfaz en español. HashRouter.
- Colores solo por tokens del tema. Las páginas no llaman a Supabase directamente: usan los `api.ts`.
- Datos sensibles de `applications` (RH, alergias, condiciones, contacto de emergencia) nunca se exponen fuera de dueño/líder.
- Fotos: solo imágenes, comprimidas en el navegador con `compressPhoto`.
- `map_url` y enlaces externos abren con `rel="noopener noreferrer"`.
- Commits de este trabajo terminan con: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Review Focus

- **`member_directory()` ejecutada por un no aprobado** (pendiente/anónimo): debe devolver vacío, nunca filas. Cubierto en Task 1.
- **`member_directory()` no debe exponer año de nacimiento ni campos sensibles**: solo las columnas listadas. Cubierto en Task 1.
- **Un miembro pendiente sube foto de moto a la carpeta de otro**: debe fallar (solo su propia carpeta). Cubierto en Task 1.
- **`map_url` con esquema no http(s)** (`javascript:…`): rechazado por check en BD y por `normalizeHttpUrl` en el formulario. Cubierto en Task 1 y Task 4.
- **Teléfono con espacios/guiones en el enlace de WhatsApp**: `wa.me` requiere solo dígitos; el enlace debe limpiar no-dígitos. Cubierto en Task 5 (prueba de componente de la tarjeta de directorio).

---

### Task 1: Migración y permisos

**Files:**
- Create: `supabase/migrations/20261009000000_garaje_ruta_directorio_anuncios.sql`
- Create: `tests/rls/garaje.test.ts`
- Modify: `src/lib/database.types.ts` (regenerado)

**Produces (BD):**
- Tabla `motorcycles(id, profile_id default auth.uid(), brand, model, year smallint?, displacement_cc int?, color default '', plate default '', photo_path?, created_at, updated_at)` con trigger `touch_updated_at` y las RLS de la sección 4.1 del spec.
- Bucket `motorcycles` (público, 5 MB, imágenes) con políticas insert/update/delete por carpeta del dueño y delete adicional para líderes.
- `events.meeting_point text not null default ''`, `events.map_url text` con check http(s).
- Tabla `announcements(id, title, body, pinned default false, created_by default auth.uid(), created_at, updated_at)` con trigger y RLS (select aprobados, escritura líderes).
- `member_directory()` → `(profile_id uuid, full_name text, nickname text, avatar_path text, city text, occupation text, phone text, birth_month smallint, birth_day smallint)`, security definer, vacío si quien llama no está aprobado; `grant execute` a `authenticated`.

- [ ] **Step 1: Escribir `tests/rls/garaje.test.ts` (falla).** Siguiendo el patrón de `tests/rls/postulaciones.test.ts` (crear actores pendiente/miembro/otro/líder con `admin.auth.admin.createUser` + update de profile). Casos:
  - motos: dueño crea/edita/borra la suya; otro miembro aprobado la lee; un pendiente no lee la de otro pero sí la propia; anónimo no lee; subir foto a carpeta propia OK, a la de otro falla.
  - `member_directory`: miembro aprobado obtiene su fila con columnas esperadas (`Object.keys` == lista) y sin `birth_date`/año; pendiente y anónimo obtienen `[]`.
  - anuncios: miembro lee, no inserta; líder inserta/edita/borra; anónimo no lee.
  - eventos: miembro no actualiza `meeting_point`; líder sí; insertar `map_url: 'javascript:alert(1)'` como líder falla.
- [ ] **Step 2: Correr y ver fallar.** `npx supabase migration up` no aplica nada nuevo aún; `npm run test:rls -- garaje` falla por tablas/función inexistentes.
- [ ] **Step 3: Escribir la migración** con todo lo de "Produces". Reusa `public.touch_updated_at()`, `public.is_approved()`, `public.is_leader()` ya existentes.
- [ ] **Step 4: Aplicar y pasar.** `npx supabase migration up`; `npm run test:rls` en verde (incluye las suites previas).
- [ ] **Step 5: Regenerar tipos.** `npm run db:types`.
- [ ] **Step 6: Commit.** `git add supabase/migrations tests/rls/garaje.test.ts src/lib/database.types.ts`.

### Task 2: Helper de fecha para cumpleaños

**Files:**
- Modify: `src/lib/dates.ts`, `src/lib/dates.test.ts`

**Produces:** `formatDayMonth(month: number, day: number): string` → "14 de mayo" (mes 1–12).

- [ ] **Step 1: Test (falla).** `expect(formatDayMonth(5, 14)).toBe('14 de mayo')`, `formatDayMonth(1, 1) === '1 de enero'`.
- [ ] **Step 2: Ver fallar.** `npx vitest run src/lib/dates.test.ts`.
- [ ] **Step 3: Implementar** con `Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' })` sobre `new Date(2000, month-1, day)`.
- [ ] **Step 4: Pasar.** `npx vitest run src/lib/dates.test.ts`.
- [ ] **Step 5: Commit.**

### Task 3: Garaje de motos

**Files:**
- Create: `src/features/motorcycles/api.ts`, `MotorcycleForm.tsx`, `MotorcycleForm.test.tsx`, `MotorcycleCard.tsx`
- Create: `src/pages/GaragePage.tsx`
- Modify: `src/App.tsx` (ruta `/garaje`), `src/pages/ProfilePage.tsx` (enlace), `src/features/applications/ApplicationDetails.tsx` (listar motos del postulante)

**Interfaces:**
- Produces (`api.ts`): `type Motorcycle = Tables<'motorcycles'>`; `type MotorcycleInput` (brand, model, year|null, displacement_cc|null, color, plate, photo: File|null); `useMotorcycles(profileId)`, `useSaveMotorcycle(userId)`, `useDeleteMotorcycle(userId)`; `motorcyclePhotoUrl(path)`.

- [ ] **Step 1: `MotorcycleForm.test.tsx` (falla).** Marca y modelo obligatorios (mensajes en español); envía datos recortados con `year`/`displacement_cc` numéricos o null; imagen no-imagen rechazada; precarga valores iniciales.
- [ ] **Step 2: Ver fallar.** `npx vitest run src/features/motorcycles/MotorcycleForm.test.tsx`.
- [ ] **Step 3: Implementar `api.ts`, `MotorcycleForm.tsx`, `MotorcycleCard.tsx`, `GaragePage.tsx`**; ruta `/garaje` en `App.tsx` bajo `RequireAccess need="approved"`; enlace "Mi garaje" en `ProfilePage`; en `ApplicationDetails` añadir `useMotorcycles(profile.id)` y render de las motos.
- [ ] **Step 4: Pasar + tipado.** `npx vitest run src/features/motorcycles`; `npx tsc -b`; `npx oxlint`.
- [ ] **Step 5: Commit.**

### Task 4: Punto de encuentro y mapa del evento

**Files:**
- Modify: `src/features/events/api.ts` (`EventInput` + `meeting_point`, `map_url`), `src/features/events/EventForm.tsx`, `src/pages/EventDetailPage.tsx`

- [ ] **Step 1: Ampliar `EventForm.test.tsx`.** Caso: `map_url` inválido muestra "Ese enlace no es válido." y no envía; con punto de encuentro y mapa válido, envía esos campos (normalizado a https).
- [ ] **Step 2: Ver fallar.** `npx vitest run src/features/events/EventForm.test.tsx`.
- [ ] **Step 3: Implementar.** `EventInput` gana `meeting_point: string` y `map_url: string | null`; `EventForm` añade los campos (map con `normalizeHttpUrl`); `EventDetailPage` muestra el punto de encuentro y botón "Ver en el mapa" si hay `map_url`.
- [ ] **Step 4: Pasar + tipado + lint.**
- [ ] **Step 5: Commit.**

### Task 5: Directorio y cumpleaños

**Files:**
- Create: `src/features/directory/api.ts`, `src/pages/DirectoryPage.tsx`
- Create: `src/features/directory/DirectoryCard.test.tsx` (prueba de la limpieza del teléfono para WhatsApp)
- Modify: `src/components/NavBar.tsx` (enlace `/directorio`), `src/App.tsx` (ruta)

**Interfaces:**
- Produces (`api.ts`): `type DirectoryMember` (de la RPC); `useDirectory()` (llama `member_directory` y agrupa las motos por `profile_id` consultando `motorcycles`); helper exportado `whatsappLink(phone): string` que deja solo dígitos → `https://wa.me/<digitos>`.

- [ ] **Step 1: `DirectoryCard.test.tsx` (falla).** `whatsappLink('300 555-0101')` → `https://wa.me/3005550101`; teléfono vacío → sin enlace de WhatsApp.
- [ ] **Step 2: Ver fallar.**
- [ ] **Step 3: Implementar `api.ts`, `DirectoryPage.tsx`** (sección "Cumpleaños de este mes" filtrando `birth_month === mes actual`, ordenado por `birth_day`, usando `formatDayMonth`; sección "Miembros" con tarjetas: foto `Avatar`, nombre/apodo, ciudad, ocupación, `tel:`/WhatsApp, y motos); enlace y ruta.
- [ ] **Step 4: Pasar + tipado + lint.**
- [ ] **Step 5: Commit.**

### Task 6: Anuncios

**Files:**
- Create: `src/features/announcements/api.ts`, `AnnouncementForm.tsx`, `AnnouncementForm.test.tsx`
- Create: `src/pages/AnnouncementsPage.tsx`, `src/pages/leader/LeaderAnnouncementsPage.tsx`
- Modify: `src/App.tsx` (rutas `/anuncios`, `/lider/anuncios`), `src/components/NavBar.tsx` (enlace), `src/pages/leader/LeaderLayout.tsx` (pestaña)

**Interfaces:**
- Produces (`api.ts`): `type Announcement = Tables<'announcements'>`; `useAnnouncements()` (pinned primero, luego `created_at` desc); `useSaveAnnouncement()`, `useSetPinned()`, `useDeleteAnnouncement()`.

- [ ] **Step 1: `AnnouncementForm.test.tsx` (falla).** Título y cuerpo obligatorios; envía con `pinned` según la casilla; conserva lo escrito si falla.
- [ ] **Step 2: Ver fallar.**
- [ ] **Step 3: Implementar** las dos páginas (miembro lee; líder CRUD+fijar), enlace, ruta y pestaña.
- [ ] **Step 4: Pasar + tipado + lint.**
- [ ] **Step 5: Commit.**

### Task 7: Datos de ejemplo y verificación

**Files:**
- Modify: `scripts/seed.mjs`, `docs/despliegue.md`

- [ ] **Step 1: Seed.** 2–3 motos repartidas, punto de encuentro + mapa en un par de eventos, 2 anuncios (uno fijado). `npm run db:seed`.
- [ ] **Step 2: Suite completa.** `npm run test` y `npm run test:rls` en verde; `npm run build` compila.
- [ ] **Step 3: Verificación en el navegador local** (recorrido del spec §8): añadir moto → verla en directorio; crear anuncio como líder → verlo como miembro; punto de encuentro + mapa en un evento → verlos en el detalle; sección de cumpleaños.
- [ ] **Step 4: Nota en `docs/despliegue.md`** recordando aplicar la migración `20261009000000` en la nube.
- [ ] **Step 5: Commit.**
