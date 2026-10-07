# Despliegue en GitHub Pages + Supabase en la nube

La web es estática y se publica en GitHub Pages. Los datos, el login y las fotos
viven en un proyecto de Supabase en la nube (plan gratuito).

## 1. Supabase en la nube (lo haces tú)

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo (región cercana,
   por ejemplo South America). Guarda la contraseña de la base de datos.
2. En **Project Settings → API** copia la **Project URL** y la clave **anon / publishable**.
3. En **Authentication → URL Configuration** pon como *Site URL* la dirección de
   GitHub Pages (`https://<usuario>.github.io/<repositorio>/`) y añádela también
   en *Redirect URLs*.
4. Deja activada la confirmación por correo (**Authentication → Providers → Email →
   Confirm email**), que en local estaba apagada.

## 2. Esquema de la base de datos

Con la terminal en la carpeta del proyecto:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref <ref-del-proyecto>
```

```bash
npx supabase db push
```

Eso aplica las migraciones de `supabase/migrations/` (tablas, permisos y buckets).
**No ejecutes `npm run db:seed` contra la nube**: el script se niega a hacerlo, y
los datos de ejemplo no deben existir en el sitio real.

## 3. Primer líder

1. Regístrate en la web publicada con tu correo y confirma el correo.
2. En Supabase, **Table Editor → profiles**, busca tu fila y cambia `role` a
   `leader` y `status` a `approved`.
3. Desde ese momento apruebas miembros y nombras líderes desde el panel.

## 4. GitHub Pages

1. Crea un repositorio en GitHub y sube el código (rama `main`).
2. En **Settings → Secrets and variables → Actions → Variables** crea:
   - `VITE_SUPABASE_URL` = la Project URL.
   - `VITE_SUPABASE_ANON_KEY` = la clave anon / publishable.
3. En **Settings → Pages**, en *Source* elige **GitHub Actions**.
4. Cada vez que se suba algo a `main`, el flujo `.github/workflows/deploy.yml`
   corre las pruebas, compila y publica. La URL aparece en la pestaña *Actions*.

## Qué no cambia

- El código es el mismo que corre en local; solo cambian las dos variables.
- Los permisos siguen aplicándose en la base de datos (RLS).
- Para seguir desarrollando en local no hace falta tocar nada: `.env.local`
  apunta al Supabase local y la nube usa las variables del repositorio.
