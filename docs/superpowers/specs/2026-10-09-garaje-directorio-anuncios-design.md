# KMO Motor Club — Garaje, ruta del evento, directorio, anuncios y cumpleaños

Fecha: 2026-10-09
Estado: pendiente de revisión del usuario

Amplía la plataforma ya en producción. Agrega cinco funcionalidades acordadas con el usuario (features 2 a 6 de la lista de recomendaciones).

## 1. Objetivo

- **Garaje:** cada miembro registra sus motos (una o varias) con sus datos y foto.
- **Ruta del evento:** los líderes indican punto de encuentro y enlace de mapa; los miembros los ven en el detalle del evento.
- **Directorio:** los miembros aprobados se ven entre sí (nombre, foto, ciudad, ocupación, teléfono y motos) para coordinar y para emergencias.
- **Anuncios:** tablón donde los líderes publican avisos y los miembros los leen.
- **Cumpleaños del mes:** sección del directorio con quienes cumplen años este mes.

## 2. Fuera de alcance

Notificaciones por correo de anuncios o eventos (es una fase aparte), comentarios o reacciones en anuncios, y exponer cualquiera de estos datos en la portada pública.

## 3. Decisión de arquitectura: exposición de datos del directorio

Hoy ciudad, ocupación y teléfono viven en `applications`, visible solo para la propia persona y los líderes. Para el directorio se expone un subconjunto mediante una **función `security definer`** (`member_directory()`) que devuelve solo columnas compartibles de los miembros aprobados. La tabla `applications` mantiene su RLS estricta; los campos sensibles (tipo de sangre, alergias, condiciones, contacto de emergencia) nunca se exponen por esta vía. Se descartó relajar la RLS de `applications` (no oculta columnas sueltas) y duplicar campos en `profiles` (sincronización).

La ficha de postulación (`applications`) **no se modifica**: conserva su foto de moto como parte del registro de postulación. El garaje es la gestión de motos continua y más rica; la ligera superposición es aceptable y evita una migración destructiva sobre datos reales ya cargados.

## 4. Modelo de datos (migración `20261009000000_garaje_ruta_directorio_anuncios.sql`)

### 4.1 `motorcycles` (garaje)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | `default gen_random_uuid()` |
| `profile_id` | uuid | `default auth.uid()`, FK a `profiles` on delete cascade |
| `brand` | text | obligatorio, 1–60 |
| `model` | text | obligatorio, 1–60 |
| `year` | smallint | nulo; check entre 1900 y extract(year from now())+1 |
| `displacement_cc` | integer | nulo; cilindraje en cc; check entre 1 y 3000 |
| `color` | text | `not null default ''`, ≤ 40 |
| `plate` | text | `not null default ''`, ≤ 15 (placa) |
| `photo_path` | text | nulo; ruta en el bucket `motorcycles` |
| `created_at` | timestamptz | `default now()` |
| `updated_at` | timestamptz | `default now()`, trigger `touch_updated_at` |

Índice en `(profile_id)`.

**RLS**
- select: `profile_id = (select auth.uid()) or public.is_approved() or public.is_leader()` — el dueño ve las suyas aunque esté pendiente; los miembros aprobados y los líderes ven todas (las motos no son dato sensible y el directorio solo lista aprobados).
- insert/update/delete: `profile_id = (select auth.uid())` — cada quien gestiona solo las suyas.

**Bucket `motorcycles`** (público por URL, 5 MB, solo imágenes), como `avatars`:
- insert/update/delete: `(storage.foldername(name))[1] = (select auth.uid())::text` (el dueño, en su carpeta) o `public.is_leader()` para borrar.
- La lectura es pública por URL (bucket público); no requiere política de select para `authenticated`.

### 4.2 `events` — columnas nuevas

- `meeting_point text not null default ''` — texto del punto de encuentro (≤ 200).
- `map_url text` — enlace de mapa; check `map_url is null or map_url ~* '^https?://[^[:space:]]+$'`.

Las funciones públicas de la portada (`public_upcoming_events`, `public_past_events`) **no** cambian: el punto de encuentro y el mapa se ven solo en el detalle del evento, para miembros aprobados.

### 4.3 `announcements` (tablón)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | `default gen_random_uuid()` |
| `title` | text | obligatorio, 1–150 |
| `body` | text | obligatorio, 1–4000 |
| `pinned` | boolean | `not null default false` |
| `created_by` | uuid | `default auth.uid()`, FK a `profiles` on delete set null |
| `created_at` | timestamptz | `default now()` |
| `updated_at` | timestamptz | `default now()`, trigger `touch_updated_at` |

**RLS**
- select: `public.is_approved()`.
- insert/update/delete: `public.is_leader()`.

### 4.4 `member_directory()`

Función `security definer`, `search_path = ''`, ejecutable por `authenticated`. Devuelve filas solo si quien llama está aprobado (`is_approved()` o `is_leader()`), si no devuelve vacío. Columnas por cada miembro **aprobado**:

`profile_id uuid, full_name text, nickname text, avatar_path text, city text, occupation text, phone text, birth_month smallint, birth_day smallint`

- Hace `left join` de `profiles` (status = 'approved') con `applications`, de modo que un miembro aprobado sin ficha aparece con los campos de ficha en blanco/nulos.
- `birth_month`/`birth_day` se derivan de `birth_date` (sin año) para no revelar la edad.
- Ordena por `full_name`.

`revoke` a `anon`; `grant execute` a `authenticated`.

Las motos del directorio se obtienen por separado consultando la tabla `motorcycles` (legible por aprobados), no desde esta función.

## 5. Interfaz

### 5.1 Garaje (feature 2)
- **`/garaje`** (miembros aprobados y pendientes): "Mi garaje". Lista las motos del usuario con tarjeta (foto, marca+modelo, año, cc, color, placa) y botones editar/borrar; botón "Añadir moto" abre el formulario (`MotorcycleForm`). Enlazado desde "Mi perfil".
- **Panel de líderes → Ver ficha**: debajo de los datos de la ficha, se listan las motos del postulante (`MotorcycleCard` de solo lectura).

### 5.2 Ruta del evento (feature 3)
- **`EventForm`** (líderes): campos "Punto de encuentro" (texto) y "Enlace de mapa" (opcional, validado con `normalizeHttpUrl`).
- **`EventDetailPage`**: en la cabecera del evento, si hay punto de encuentro se muestra; si hay `map_url`, un botón "Ver en el mapa" (`target=_blank`, `rel=noopener`).

### 5.3 Directorio (feature 4) y cumpleaños (feature 6)
- **`/directorio`** (miembros aprobados): 
  - Sección "Cumpleaños de este mes": miembros cuyo `birth_month` es el mes actual, ordenados por día, con foto, nombre y "cumple el D de MMMM".
  - Sección "Miembros": tarjetas con foto, nombre/apodo, ciudad, ocupación, teléfono (enlaces `tel:` y WhatsApp `https://wa.me/<solo dígitos>`) y sus motos (marca+modelo, o miniatura).

### 5.4 Anuncios (feature 5)
- **`/anuncios`** (miembros aprobados): lista de anuncios, los `pinned` primero y luego por fecha descendente; cada uno con título, cuerpo, autor y fecha; los fijados llevan una insignia "Fijado".
- **`/lider/anuncios`** (líderes): lista con crear (`AnnouncementForm`: título, cuerpo, casilla "Fijar arriba"), editar, fijar/desfijar y borrar.

### 5.5 Navegación y rutas
- `memberLinks` (barra): se añaden `{ to: '/directorio', label: 'Directorio' }` y `{ to: '/anuncios', label: 'Anuncios' }`.
- Panel de líderes (`LeaderLayout`): pestaña `{ to: 'anuncios', label: 'Anuncios' }`.
- "Mi perfil": enlace a `/garaje` ("Mi garaje").
- Rutas nuevas bajo `RequireAccess need="approved"`: `/garaje`, `/directorio`, `/anuncios`. Bajo `RequireAccess need="leader"` dentro de `/lider`: `anuncios`.

## 6. Estructura del código

```
supabase/migrations/20261009000000_garaje_ruta_directorio_anuncios.sql
src/features/motorcycles/api.ts            consultas y mutaciones de motos + foto
src/features/motorcycles/MotorcycleForm.tsx
src/features/motorcycles/MotorcycleCard.tsx
src/features/directory/api.ts              useDirectory() (RPC) + motos por miembro
src/features/announcements/api.ts          CRUD de anuncios
src/features/announcements/AnnouncementForm.tsx
src/pages/GaragePage.tsx
src/pages/DirectoryPage.tsx                directorio + cumpleaños
src/pages/AnnouncementsPage.tsx
src/pages/leader/LeaderAnnouncementsPage.tsx
```

Ediciones: `src/features/events/api.ts` y `EventForm.tsx` y `EventDetailPage.tsx` (punto de encuentro + mapa); `src/features/applications/ApplicationDetails.tsx` (listar motos del postulante); `src/App.tsx` (rutas); `src/components/NavBar.tsx` (menú); `src/pages/leader/LeaderLayout.tsx` (pestaña); `src/pages/ProfilePage.tsx` (enlace al garaje); `src/lib/dates.ts` (nuevo helper `formatDayMonth(month, day): string` que devuelve "D de MMMM" a partir de mes y día, para la sección de cumpleaños, con sus pruebas unitarias).

Cada feature separa sus consultas (`api.ts`) de sus componentes, como el resto del proyecto. Las páginas no llaman a Supabase directamente.

## 7. Datos de ejemplo (`scripts/seed.mjs`)

- Dos o tres motos repartidas entre los miembros de ejemplo.
- Punto de encuentro y enlace de mapa en un par de eventos.
- Dos anuncios, uno de ellos fijado.

## 8. Pruebas

- **Permisos (`tests/rls/`):**
  - `motorcycles`: el dueño crea/edita/borra solo las suyas; un miembro aprobado lee las de otros; un pendiente no lee las de otros pero sí las propias; nadie sin sesión lee; subida de foto solo en la carpeta propia.
  - `announcements`: miembro aprobado lee pero no escribe; líder crea/edita/fija/borra; anónimo/pendiente no lee.
  - `member_directory()`: un aprobado obtiene filas (solo columnas seguras, sin año de nacimiento); un pendiente y un anónimo obtienen vacío; no aparecen campos sensibles.
  - `events`: un miembro no puede escribir `meeting_point`/`map_url`; un líder sí; `map_url` no http(s) se rechaza.
- **Componentes (RTL):** `MotorcycleForm` (marca y modelo obligatorios; envía datos recortados; año/cc opcionales), `AnnouncementForm` (título y cuerpo obligatorios; "fijar" opcional).
- **Verificación manual en el navegador local:** añadir una moto y verla en el directorio; crear un anuncio como líder y verlo como miembro; poner punto de encuentro y mapa en un evento y verlos en el detalle; comprobar la sección de cumpleaños.

## 9. Manejo de errores y privacidad

- Formularios con validación previa y mensajes en español; errores de red/permiso con `friendlyError` y opción de reintentar, conservando lo escrito.
- El directorio y las motos solo para miembros aprobados; los datos sensibles de la ficha siguen siendo solo para líderes.
- `map_url` y los enlaces de WhatsApp/teléfono se abren con `rel="noopener noreferrer"`.
