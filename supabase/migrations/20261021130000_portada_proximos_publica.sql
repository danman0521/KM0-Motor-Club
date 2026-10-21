-- La portada pública de "Próximos eventos" necesita que un visitante (anónimo)
-- pueda leer la foto de portada de un evento futuro. Hasta ahora solo eran
-- públicas las fotos de eventos ya realizados. Se amplía la función para incluir
-- también la portada de los eventos próximos.

create or replace function public.is_public_event_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.public_past_events() shown where p_path = any (shown.photos))
    or exists (
      select 1 from public.events e
      where e.starts_at >= now() and e.cover_photo_path = p_path
    );
$$;
