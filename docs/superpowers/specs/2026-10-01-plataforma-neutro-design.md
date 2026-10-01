# Plataforma web del grupo de moteros Neutro — Diseño

Fecha: 2026-10-01
Estado: pendiente de revisión del usuario

## 1. Objetivo

Plataforma web para el grupo de moteros **Neutro** donde:

- Los **líderes** publican el historial de eventos (crónica, fotos y videos), programan el calendario, eligen al motero destacado del mes y deciden sobre los eventos que postula la comunidad.
- Los **miembros** aprobados ven todo el contenido y postulan eventos.
- Los **visitantes** ven una portada pública.

**Alcance de esta fase:** todo corre en el PC del usuario, sin desplegar nada. El despliegue (GitHub Pages + Supabase en la nube) queda para una fase posterior; el diseño lo deja preparado pero no lo ejecuta.

## 2. Fuera de alcance

Chat, comentarios, votaciones, notificaciones (correo o push), pagos, subida directa de videos, despliegue a internet, app móvil nativa.

## 3. Arquitectura

| Pieza | Tecnología | Dónde corre en esta fase |
|---|---|---|
| Web | React + Vite + TypeScript, React Router (HashRouter), Tailwind CSS | `npm run dev` en `localhost:5173` |
| Login | Supabase Auth (correo y contraseña) | Supabase local (Docker) |
| Base de datos | Postgres con seguridad por filas (RLS) | Supabase local (Docker) |
| Fotos | Supabase Storage | Supabase local (Docker) |
| Videos | Enlaces de YouTube incrustados | YouTube |

- Supabase local se levanta con `npx supabase start` y requiere Docker Desktop encendido. Incluye Studio (`localhost:54323`) para inspeccionar datos.
- La web lee la URL y la clave pública de Supabase desde `.env.local`. Pasar a la nube más adelante es cambiar esas dos variables y aplicar las mismas migraciones.
- Se usa HashRouter (`/#/eventos`) porque GitHub Pages no soporta rutas de SPA sin trucos; así el paso a Pages no exige cambios.
- El esquema, las políticas RLS y los datos de ejemplo viven en `supabase/migrations/` y `supabase/seed.sql`, versionados en git.
- En local se desactiva la confirmación de correo para poder registrar cuentas de prueba sin enviar correos.

**Principio de seguridad:** los permisos se aplican en la base de datos con RLS. La interfaz oculta lo que no corresponde, pero no es la barrera: un visitante o un miembro pendiente no puede leer datos privados aunque llame a la API directamente.

## 4. Roles y estados

Cada cuenta tiene un perfil con `role` (`member` | `leader`) y `status` (`pending` | `approved` | `rejected`).

| Quién | Condición | Qué puede hacer |
|---|---|---|
| Visitante | Sin sesión | Ver la portada pública |
| Miembro pendiente | `status = pending` | Ver la portada y una pantalla de "esperando aprobación" |
| Miembro rechazado | `status = rejected` | Igual que pendiente, con mensaje de solicitud rechazada |
| Miembro | `approved` + `member` | Ver toda la zona privada, postular eventos |
| Líder | `approved` + `leader` | Todo lo anterior + panel de líderes |

- Al registrarse, el perfil se crea automáticamente (trigger en la base de datos) como `member` + `pending`.
- Un usuario no puede cambiar su propio `role` ni `status`; solo un líder puede.
- El primer líder se crea con `supabase/seed.sql` (cuenta local de prueba). Los demás los nombra un líder desde el panel.
- Un líder no puede quitarse a sí mismo el rol de líder (evita dejar el grupo sin líderes).

## 5. Pantallas

### Zona pública

- **Portada (`/`)**: logo y presentación del grupo, próximos eventos (título, fecha, lugar; máximo 3), motero destacado del mes actual (nombre, foto, motivo), botones Ingresar y Registrarse.
- **Ingresar (`/ingresar`)** y **Registrarse (`/registro`)**: correo, contraseña; en registro además nombre completo y apodo (opcional).
- **Pendiente (`/pendiente`)**: mensaje según estado (pendiente o rechazado) y botón de cerrar sesión.

### Zona privada (miembros aprobados)

- **Eventos (`/eventos`)**: lista de eventos realizados, del más reciente al más antiguo, con portada, título, fecha y lugar.
- **Detalle de evento (`/eventos/:id`)**: descripción, crónica, galería de fotos (con visor ampliado) y videos de YouTube incrustados. Sirve tanto para eventos pasados como futuros.
- **Calendario (`/calendario`)**: cuadrícula mensual con navegación entre meses; los días con evento muestran el título y enlazan al detalle. Debajo, lista de próximos eventos.
- **Motero destacado (`/destacado`)**: el del mes actual en grande y el salón de la fama con los de meses anteriores.
- **Sugerencias (`/sugerencias`)**: formulario para postular (título, descripción, fecha tentativa opcional) y lista de todas las sugerencias con autor y estado (pendiente, aprobada, rechazada). Las rechazadas muestran la nota del líder si la hay.

### Panel de líderes (`/lider/...`)

- **Miembros**: solicitudes pendientes con Aprobar / Rechazar; lista de miembros con opción de nombrar o quitar líder y de revocar acceso (pasa el `status` a `rejected`; se puede volver a aprobar).
- **Eventos**: crear, editar y borrar. Campos: título, descripción, lugar, fecha y hora, crónica, foto de portada. Gestión de fotos (subida múltiple, borrar) y de videos (pegar enlace de YouTube, borrar).
- **Destacado**: elegir mes, miembro, motivo y foto. Un destacado por mes; se puede editar.
- **Sugerencias**: aprobar o rechazar con nota opcional. Aprobar abre el formulario de evento precargado con los datos de la sugerencia; al guardarlo, la sugerencia queda `approved` y enlazada al evento creado.

### Navegación

Barra superior con logo; en celular, menú desplegable. Las entradas visibles dependen del rol. Rutas protegidas redirigen: sin sesión → `/ingresar`; no aprobado → `/pendiente`; no líder en `/lider/*` → `/eventos`.

## 6. Modelo de datos

Un **evento es un solo registro**: con fecha futura aparece en calendario y portada; cuando su fecha pasa, aparece en el historial y el líder le añade crónica, fotos y videos.

**`profiles`** — `id` (= id de auth), `full_name`, `nickname`, `role`, `status`, `created_at`.

**`events`** — `id`, `title`, `description`, `location`, `starts_at`, `chronicle` (nulo hasta que se escribe), `cover_photo_path` (nulo), `created_by`, `created_at`.

**`event_photos`** — `id`, `event_id`, `storage_path`, `uploaded_by`, `created_at`. Se borran en cascada con el evento.

**`event_videos`** — `id`, `event_id`, `youtube_id`, `title` (opcional), `created_at`. Se guarda el id del video ya validado, no la URL cruda.

**`featured_riders`** — `id`, `month` (primer día del mes, único), `profile_id`, `reason`, `photo_path`, `created_by`, `created_at`.

**`suggestions`** — `id`, `title`, `description`, `tentative_date` (nulo), `proposed_by`, `status` (`pending` | `approved` | `rejected`), `leader_note` (nulo), `event_id` (nulo; se llena al aprobar), `created_at`.

### Permisos (RLS)

| Tabla | Miembro aprobado | Líder | Anónimo / pendiente |
|---|---|---|---|
| `profiles` | Lee todos los aprobados; edita su nombre y apodo | Lee y edita todos (incluye `role`, `status`) | Solo lee el suyo |
| `events`, `event_photos`, `event_videos` | Lee | Lee y escribe | Nada |
| `featured_riders` | Lee | Lee y escribe | Nada |
| `suggestions` | Lee todas; crea las suyas como `pending` | Lee todas; cambia estado, nota y `event_id` | Nada |

La portada pública no lee las tablas directamente. Usa dos funciones de base de datos que devuelven solo columnas seguras:

- `public_upcoming_events()` → título, fecha y lugar de los 3 próximos eventos.
- `public_current_featured()` → nombre o apodo, motivo y foto del destacado del mes actual.

### Archivos

- Bucket **`event-photos`** (privado): lectura para miembros aprobados mediante URL firmadas; escritura para líderes.
- Bucket **`featured`** (público): fotos del motero destacado, porque se muestran en la portada pública; escritura para líderes.
- Antes de subir, las fotos se comprimen en el navegador (lado mayor 1600 px, objetivo ≈ 300 KB, formato JPEG/WebP). Solo se aceptan imágenes.

## 7. Estructura del código

```
src/
  config/site.ts          nombre del grupo, textos de portada, logo
  lib/supabase.ts         cliente de Supabase
  lib/youtube.ts          extraer y validar el id de un enlace de YouTube
  lib/images.ts           compresión de fotos
  lib/dates.ts            utilidades de calendario (cuadrícula del mes, pasado/futuro)
  auth/                   contexto de sesión + perfil, guardas de ruta
  features/
    events/               consultas, lista, detalle, galería, formulario
    calendar/             cuadrícula mensual
    featured/             destacado actual, salón de la fama, formulario
    suggestions/          lista, formulario, revisión
    members/              aprobación y roles
  pages/                  una página por ruta; componen las features
  components/             botones, tarjetas, modal, barra de navegación
supabase/
  migrations/             esquema, RLS, funciones, buckets
  seed.sql                líder inicial y datos de ejemplo
```

Cada feature expone sus consultas (leer/escribir en Supabase) separadas de sus componentes, de modo que las páginas no hablan con Supabase directamente. Las consultas usan TanStack Query para caché, estados de carga y refresco tras escribir.

## 8. Identidad visual

Colores tomados del logo (`branding/logo-neutro.webp`). Tema oscuro, diseñado primero para celular.

| Uso | Color |
|---|---|
| Fondo | `#020202` |
| Superficies (tarjetas, barra) | `#171718` / `#272728` |
| Bordes y texto secundario | `#575758` / `#868688` |
| Texto principal | `#FCFCFC` |
| Primario (botones, acentos, títulos) | `#AB1516`; hover `#C73032`; oscuro `#770B0E` |
| Secundario (cabeceras, etiquetas, calendario) | `#263355`; oscuro `#1A223B` |
| Azul acero claro (texto sobre azul, detalles) | `#B4BACC` |
| Crema (detalle puntual: insignia de destacado) | `#CEB98B` |

Los colores se definen una sola vez como tokens del tema de Tailwind. Títulos en una tipografía condensada y gruesa que evoque el rótulo del logo; texto en una sans-serif legible. El logo se usa en la barra de navegación, la portada y como favicon.

## 9. Manejo de errores

- Formularios: validación antes de enviar (campos obligatorios, enlace de YouTube válido, archivo de imagen) con mensajes en español junto al campo.
- Errores de Supabase (red, permisos): mensaje visible y no técnico, con opción de reintentar; el formulario conserva lo escrito.
- Subida múltiple de fotos: progreso por foto; si una falla, las demás continúan y se indica cuál falló.
- Sesión expirada: se redirige a `/ingresar` y, tras ingresar, se vuelve a la ruta original.
- Pantallas vacías con mensaje propio ("Aún no hay eventos", "Sin sugerencias todavía").

## 10. Pruebas

- **Unitarias (Vitest):** `lib/youtube.ts` (formatos de enlace válidos e inválidos), `lib/dates.ts` (cuadrícula del mes, clasificación pasado/futuro), guardas de ruta.
- **Permisos (integración contra Supabase local):** un script de pruebas inicia sesión como anónimo, pendiente, miembro y líder y verifica que cada uno lee y escribe solo lo que la tabla de permisos indica, incluyendo que un miembro no puede ascenderse a líder ni aprobarse a sí mismo.
- **Componentes (React Testing Library):** formulario de sugerencia, formulario de evento, flujo aprobar sugerencia → evento.
- **Verificación manual en navegador** del recorrido completo: registro → aprobación → ver eventos → postular → aprobar → aparece en calendario y portada.

## 11. Cómo se ejecuta en local

1. Encender Docker Desktop.
2. `npx supabase start` (la primera vez descarga las imágenes; aplica migraciones y seed).
3. `npm run dev` y abrir `http://localhost:5173`.
4. Ingresar con la cuenta de líder del seed (credenciales documentadas en el README y en `.env.example`, válidas solo en local).

## 12. Fase posterior (no incluida)

Crear el proyecto de Supabase en la nube, aplicar las migraciones, publicar la web en GitHub Pages con GitHub Actions, activar confirmación de correo y crear el primer líder real.
