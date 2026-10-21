-- La portada pública de "Próximos eventos" muestra también la foto de portada
-- del evento. Hay que recrear la función porque cambia su tipo de retorno.

drop function if exists public.public_upcoming_events();

create function public.public_upcoming_events()
returns table (title text, starts_at timestamptz, location text, cover_photo_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.title, e.starts_at, e.location, e.cover_photo_path
  from public.events e
  where e.starts_at >= now()
  order by e.starts_at
  limit 3;
$$;

grant execute on function public.public_upcoming_events() to anon, authenticated;
