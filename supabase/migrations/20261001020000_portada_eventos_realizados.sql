-- Portada pública: últimos eventos realizados con algunas de sus fotos.
-- Solo las fotos que devuelve esta función quedan abiertas a visitantes;
-- el resto de cada galería sigue siendo para miembros aprobados.

create function public.public_past_events()
returns table (title text, starts_at timestamptz, location text, photos text[])
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.title,
    e.starts_at,
    e.location,
    coalesce(
      (
        select array_agg(shown.storage_path order by shown.is_cover desc, shown.created_at)
        from (
          -- Hasta 4 fotos: la portada primero y luego por orden de subida
          select
            p.storage_path,
            p.created_at,
            (p.storage_path is not distinct from e.cover_photo_path) as is_cover
          from public.event_photos p
          where p.event_id = e.id
          order by is_cover desc, p.created_at
          limit 4
        ) shown
      ),
      '{}'
    )
  from public.events e
  where e.starts_at < now()
  order by e.starts_at desc
  limit 6;
$$;

grant execute on function public.public_past_events() to anon, authenticated;

create function public.is_public_event_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.public_past_events() shown where p_path = any (shown.photos)
  );
$$;

grant execute on function public.is_public_event_photo(text) to anon, authenticated;

-- Visitantes (y cuentas aún no aprobadas) pueden ver solo las fotos de la portada
create policy "event_photos_objects_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'event-photos' and public.is_public_event_photo(name));
