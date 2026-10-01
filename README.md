# Neutro

Plataforma web del grupo de moteros Neutro: portada pública, zona de miembros (eventos con asistencia, calificación y comentarios; calendario; motero destacado; sugerencias; convenios; perfil con foto) y panel de líderes.

Por ahora todo corre en local. Nada se despliega ni usa servicios en la nube.

## Requisitos

- Node.js 22 o superior
- Docker Desktop (para Supabase local)

## Primera vez

```bash
npm install
```

Con Docker Desktop encendido:

```bash
npm run db:start
```

La primera vez descarga las imágenes de Supabase y aplica el esquema.

```bash
npm run db:env
```

Escribe `.env.local` con la URL y la clave pública del Supabase local.

```bash
npm run db:seed
```

Crea las cuentas de prueba y los datos de ejemplo.

## Día a día

1. Enciende Docker Desktop.
2. `npm run db:start`
3. `npm run dev` y abre <http://localhost:5173>

Para apagar Supabase: `npm run db:stop` (los datos se conservan).

## Cuentas de prueba

`npm run db:seed` crea un líder, dos miembros aprobados y uno pendiente. Los correos y la contraseña están al inicio de [scripts/seed.mjs](scripts/seed.mjs). Solo existen en tu PC.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Web en modo desarrollo |
| `npm run build` | Compila la web a `dist/` |
| `npm run test` | Pruebas unitarias y de componentes |
| `npm run test:rls` | Pruebas de permisos contra Supabase local |
| `npm run db:start` / `db:stop` | Enciende o apaga Supabase local |
| `npm run db:reset` | Borra los datos y vuelve a aplicar el esquema |
| `npm run db:seed` | Carga cuentas y datos de ejemplo |
| `npm run db:env` | Genera `.env.local` |
| `npm run db:types` | Regenera los tipos de la base de datos |

Supabase Studio (para ver las tablas) queda en <http://127.0.0.1:54323>.

## Redes sociales

Los botones de la portada y del pie de página salen de la lista `social` en [src/config/site.ts](src/config/site.ts). Los enlaces actuales son de ejemplo: cámbialos por los perfiles reales del grupo. Para quitar un botón, borra su línea.

## Base de datos

Si llega una migración nueva en `supabase/migrations/`, aplícala sin borrar los datos con:

```bash
npx supabase migration up
```

`npm run db:reset` también la aplica, pero borra todos los datos.

## Cómo está organizado

- `src/pages/` — una página por ruta.
- `src/features/` — eventos (con asistencia, calificaciones y comentarios), calendario, destacado, sugerencias, convenios, perfil y miembros; cada una con sus consultas y componentes.
- `src/auth/` — sesión, perfil y protección de rutas.
- `src/config/site.ts` — nombre del grupo, lema, texto de la portada y redes sociales.
- `src/index.css` — colores del tema, tomados del logo.
- `supabase/migrations/` — tablas, permisos por rol (RLS) y almacenamiento de fotos.

Los permisos se aplican en la base de datos, no solo en la interfaz. `npm run test:rls` comprueba qué puede leer y escribir cada rol.

## Documentos

- Diseño: [docs/superpowers/specs/2026-10-01-plataforma-neutro-design.md](docs/superpowers/specs/2026-10-01-plataforma-neutro-design.md)
- Plan: [docs/superpowers/plans/2026-10-01-plataforma-neutro.md](docs/superpowers/plans/2026-10-01-plataforma-neutro.md)
- Fase 2 (perfil, participación y convenios): [docs/superpowers/specs/2026-10-01-fase-2-comunidad-design.md](docs/superpowers/specs/2026-10-01-fase-2-comunidad-design.md)
