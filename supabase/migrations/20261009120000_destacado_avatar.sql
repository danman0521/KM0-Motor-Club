-- El destacado del mes puede mostrar la foto de perfil del motero cuando no se
-- subió una foto específica para el destacado. La portada pública (anónima) lee
-- al destacado a través de esta función, así que debe exponer también el avatar.

drop function if exists public.public_current_featured();

create function public.public_current_featured()
returns table (display_name text, reason text, photo_path text, avatar_path text, month date)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.nickname, p.full_name), f.reason, f.photo_path, p.avatar_path, f.month
  from public.featured_riders f
  join public.profiles p on p.id = f.profile_id
  where f.month = date_trunc('month', now())::date;
$$;

grant execute on function public.public_current_featured() to anon, authenticated;
