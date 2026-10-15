-- Cada motero puede indicar en su perfil si anda de piloto (conduce) o de
-- copiloto (acompañante). Es opcional. Se ve en el perfil, en el directorio y
-- en el panel de líderes.

create type public.ride_role as enum ('piloto', 'copiloto');

alter table public.profiles add column ride_role public.ride_role;

-- El directorio expone también el rol (piloto/copiloto). Cambia el tipo de
-- retorno de la función, así que hay que recrearla.
drop function if exists public.member_directory();

create function public.member_directory()
returns table (
  profile_id uuid,
  full_name text,
  nickname text,
  avatar_path text,
  city text,
  occupation text,
  phone text,
  birth_month smallint,
  birth_day smallint,
  ride_role public.ride_role
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.nickname,
    p.avatar_path,
    coalesce(a.city, ''),
    coalesce(a.occupation, ''),
    coalesce(a.phone, ''),
    extract(month from a.birth_date)::smallint,
    extract(day from a.birth_date)::smallint,
    p.ride_role
  from public.profiles p
  left join public.applications a on a.profile_id = p.id
  where p.status = 'approved'
    and (public.is_approved() or public.is_leader())
  order by p.full_name;
$$;

revoke execute on function public.member_directory() from anon, public;
grant execute on function public.member_directory() to authenticated;
