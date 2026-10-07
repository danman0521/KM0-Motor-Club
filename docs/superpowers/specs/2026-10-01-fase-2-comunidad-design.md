# Neutro, fase 2: perfil, participación en eventos y convenios — Diseño

Fecha: 2026-10-01
Estado: construido. El usuario confirmó: foto de perfil (las fotos de eventos solo las suben los líderes), calificación y comentarios solo cuando el evento ya pasó, y asistencia con Voy / No voy. Lo marcado como **decisión por defecto** no lo ha confirmado.

Amplía el diseño base: `2026-10-01-plataforma-neutro-design.md`. Sigue todo en local.

## 1. Qué se añade

1. **Foto de perfil.** Cada miembro aprobado sube su foto y edita su nombre y apodo en una página "Mi perfil". La foto aparece junto a su nombre en comentarios, asistentes y lista de miembros.
   - Confirmado: es la foto de perfil; las fotos de los eventos solo las suben los líderes.
2. **Confirmar participación.** En un evento próximo cada miembro marca "Voy" o "No voy" y puede cambiarlo hasta que el evento empiece. Todos los miembros ven quiénes van y el total.
   - Confirmado: dos opciones, sin "tal vez". **Decisión por defecto:** la lista de quienes van la ven todos los miembros.
3. **Calificación y comentarios.** Solo cuando el evento ya pasó. Calificación de 1 a 5 estrellas, una por miembro, modificable; se muestra el promedio. Comentarios libres, varios por miembro.
   - Confirmado: ambos se habilitan únicamente cuando el evento ya pasó.
   - **Decisión por defecto:** califica y comenta cualquier miembro aprobado, haya confirmado asistencia o no. Los comentarios no se editan: el autor o un líder pueden borrarlos.
4. **Convenios con empresas.** Página de miembros con las empresas aliadas: nombre, logo, categoría, beneficio, descripción, teléfono, dirección, sitio web y vigencia. Los líderes los crean, editan, desactivan y borran.
   - **Decisión por defecto:** los convenios solo los ven los miembros aprobados (no la portada pública). Un convenio inactivo o vencido deja de mostrarse a los miembros; los líderes lo siguen viendo.

5. **Redes sociales.** Botones en la portada y en el pie de todas las páginas que llevan a los perfiles del grupo. Los enlaces se definen en `src/config/site.ts`.
   - **Pendiente del usuario:** los enlaces reales; por ahora apuntan a la página principal de cada red.

## 2. Fuera de alcance

Respuestas anidadas y edición de comentarios, notificaciones, "tal vez" en asistencia, fotos de eventos subidas por miembros, códigos o cupones de convenios, convenios en la portada pública.

## 3. Datos

**`profiles`** — columna nueva `avatar_path` (nula). Debe empezar por el id del propio usuario.

**`event_attendance`** — `event_id`, `profile_id` (clave compuesta), `status` (`going` | `not_going`), `updated_at`.

**`event_ratings`** — `event_id`, `profile_id` (clave compuesta), `stars` (1 a 5), `updated_at`.

**`event_comments`** — `id`, `event_id`, `author_id`, `body` (1 a 1000 caracteres), `created_at`.

**`partners`** — `id`, `name`, `category`, `benefit`, `description`, `phone`, `address`, `website` (solo `http://` o `https://`), `logo_path`, `valid_until` (nula), `active`, `created_by`, `created_at`.

Las filas de asistencia, calificación y comentarios se borran en cascada con el evento o con el miembro.

### Permisos (RLS)

| Tabla | Miembro aprobado | Líder | Anónimo / pendiente |
|---|---|---|---|
| `profiles.avatar_path` | Cambia la suya | Cambia la de cualquiera | Nada |
| `event_attendance` | Lee todas; escribe la suya solo antes de que empiece el evento | Igual que miembro | Nada |
| `event_ratings` | Lee todas; escribe la suya solo cuando el evento ya empezó | Igual que miembro | Nada |
| `event_comments` | Lee todos; crea a su nombre solo cuando el evento ya empezó; borra los suyos | Además borra cualquiera | Nada |
| `partners` | Lee los activos y vigentes | Lee y escribe todos | Nada |

### Archivos

- Bucket **`avatars`** (público por URL, nombres aleatorios): cada miembro aprobado escribe solo dentro de su carpeta `<su id>/`; los líderes pueden borrar cualquiera.
- Bucket **`partners`** (público): logos; escriben los líderes.
- Mismas reglas de fotos: solo imágenes, comprimidas en el navegador.

## 4. Pantallas

- **Mi perfil (`/perfil`)**: foto actual, subir o quitar foto, nombre y apodo. Se llega desde el nombre del usuario en la barra.
- **Detalle de evento**:
  - Próximo: bloque "¿Vas a ir?" con botones Voy / No voy, total y lista de quienes van.
  - Realizado: lista de quienes confirmaron, promedio de estrellas con número de votos, selector para calificar y comentarios (del más antiguo al más reciente, con foto y nombre del autor) con caja para escribir.
- **Listas**: las tarjetas de eventos realizados muestran el promedio; los próximos del calendario muestran cuántos van.
- **Convenios (`/convenios`)**: tarjetas agrupadas por categoría.
- **Panel de líderes → Convenios (`/lider/convenios`)**: lista con editar, activar/desactivar y borrar, y formulario.
- **Panel de líderes → Miembros**: muestra la foto de cada miembro.

## 5. Código

```
supabase/migrations/20261001010000_comunidad.sql
src/components/Avatar.tsx
src/features/profile/api.ts                 perfil propio y foto
src/features/events/community.ts            asistencia, calificaciones, comentarios
src/features/events/AttendanceSection.tsx, RatingSection.tsx, StarRating.tsx, CommentsSection.tsx
src/features/partners/api.ts, PartnerCard.tsx, PartnerForm.tsx
src/lib/url.ts                              validar enlaces http(s)
src/pages/ProfilePage.tsx, PartnersPage.tsx, leader/LeaderPartnersPage.tsx
```

## 6. Pruebas

- **Permisos:** casos nuevos en `tests/rls/` para cada fila de la tabla de arriba, incluidos: no se confirma asistencia a un evento pasado, no se califica ni se comenta un evento futuro, estrellas fuera de 1 a 5, comentar a nombre de otro, subir foto a la carpeta de otro, y un miembro no ve convenios inactivos o vencidos.
- **Unitarias y de componentes:** `lib/url.ts`, `StarRating`, formulario de comentario y `PartnerForm`.
- **Navegador:** subir foto de perfil, confirmar asistencia, calificar, comentar y borrar comentario, crear un convenio y verlo como miembro.

## 7. Plan

1. Pruebas de permisos nuevas (fallan) → migración → pasan → regenerar tipos.
2. `lib/url.ts` y `StarRating` con sus pruebas.
3. Perfil y `Avatar`.
4. Asistencia, calificación y comentarios en el detalle de evento; resúmenes en listas.
5. Convenios: página de miembros y gestión de líderes.
6. Datos de ejemplo, verificación en navegador, README.

## 8. Añadido: eventos realizados en la portada pública

A pedido del usuario, la portada muestra también los eventos realizados con sus fotos.

- Se muestran los 6 eventos realizados más recientes, con título, fecha, lugar y hasta 4 fotos de cada uno: la portada primero y luego por orden de subida.
- Esto cambia la regla original de privacidad: **esas fotos quedan visibles para cualquier visitante**. El resto de cada galería, las crónicas, los videos, los comentarios y las calificaciones siguen siendo solo para miembros aprobados.
- En base de datos: la función `public_past_events()` devuelve solo esas columnas y rutas, y una política de almacenamiento permite a visitantes obtener URL firmadas únicamente de las rutas que esa función devuelve (`is_public_event_photo`).
- Un evento sin fotos aparece con el logo del grupo.
- Para elegir qué foto encabeza un evento en la portada, el líder usa "Usar de portada" en el editor del evento.

## 9. Añadido (7 de octubre): pantalla de espera obligatoria y ficha de postulación

- **Registro:** si el proyecto exige confirmar el correo (así está en la nube), tras crear la cuenta se muestra "Revisa tu correo" con botón de reenvío. Una cuenta con sesión pero sin aprobar solo puede ver la pantalla de espera; cualquier otra ruta redirige a `/pendiente`. La pantalla de espera consulta el perfil cada 30 s y pasa sola a la zona de miembros al ser aprobada.
- **Ficha de postulación (tabla `applications`, una por perfil):** ciudad, ocupación, fecha de nacimiento (mínimo 16 años), celular, otro grupo motero, tipo de sangre (RH), alergias, condiciones de salud, nombre y teléfono del contacto de emergencia, foto de la moto (bucket privado `applications`) y foto de la persona (va a su foto de perfil, por lo que ahora cualquier cuenta con sesión puede subir a su propia carpeta de `avatars`).
- **Quién la ve:** la propia persona (la llena en la espera y la edita luego en `/ficha`, enlazada desde "Mi perfil") y los líderes (botón "Ver ficha" en el panel de miembros, tanto para pendientes como para aprobados). Nadie más.
- **Decisiones por defecto:** las fotos son opcionales; los campos obligatorios son ciudad, ocupación, fecha de nacimiento, RH y contacto de emergencia; no se puede borrar una ficha, solo editarla.
