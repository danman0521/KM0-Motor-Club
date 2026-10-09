-- Garaje de motos, punto de encuentro/mapa en eventos, tablón de anuncios,
-- directorio de miembros y cumpleaños.

-- ---------------------------------------------------------------------------
-- Motos (garaje)
-- ---------------------------------------------------------------------------

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  brand text not null check (char_length(brand) between 1 and 60),
  model text not null check (char_length(model) between 1 and 60),
  year smallint check (year is null or (year between 1900 and extract(year from now())::int + 1)),
  displacement_cc integer check (displacement_cc is null or (displacement_cc between 1 and 3000)),
  color text not null default '' check (char_length(color) <= 40),
  plate text not null default '' check (char_length(plate) <= 15),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index motorcycles_profile_idx on public.motorcycles (profile_id);

-- La foto de la moto vive en la carpeta del propio usuario
alter table public.motorcycles
  add constraint motorcycles_photo_in_own_folder
  check (photo_path is null or photo_path like profile_id::text || '/%');

create trigger motorcycles_touch
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();

alter table public.motorcycles enable row level security;

-- El dueño ve las suyas aunque esté pendiente; los aprobados y los líderes ven todas
create policy "motorcycles_select" on public.motorcycles
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_approved() or public.is_leader());
create policy "motorcycles_insert" on public.motorcycles
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "motorcycles_update" on public.motorcycles
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "motorcycles_delete" on public.motorcycles
  for delete to authenticated using (profile_id = (select auth.uid()));

revoke all on public.motorcycles from anon;

-- Bucket de fotos de moto (público por URL; no es dato sensible)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('motorcycles', 'motorcycles', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "motorcycles_objects_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'motorcycles' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "motorcycles_objects_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'motorcycles' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'motorcycles' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "motorcycles_objects_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'motorcycles'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_leader())
  );

-- ---------------------------------------------------------------------------
-- Eventos: punto de encuentro y mapa
-- ---------------------------------------------------------------------------

alter table public.events add column meeting_point text not null default '' check (char_length(meeting_point) <= 200);
alter table public.events add column map_url text check (map_url is null or map_url ~* '^https?://[^[:space:]]+$');

-- ---------------------------------------------------------------------------
-- Anuncios (tablón)
-- ---------------------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  body text not null check (char_length(body) between 1 and 4000),
  pinned boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_order_idx on public.announcements (pinned desc, created_at desc);

create trigger announcements_touch
  before update on public.announcements
  for each row execute function public.touch_updated_at();

alter table public.announcements enable row level security;

create policy "announcements_select" on public.announcements
  for select to authenticated using (public.is_approved());
create policy "announcements_insert" on public.announcements
  for insert to authenticated with check (public.is_leader());
create policy "announcements_update" on public.announcements
  for update to authenticated using (public.is_leader()) with check (public.is_leader());
create policy "announcements_delete" on public.announcements
  for delete to authenticated using (public.is_leader());

revoke all on public.announcements from anon;

-- ---------------------------------------------------------------------------
-- Directorio de miembros: solo columnas compartibles de los aprobados
-- ---------------------------------------------------------------------------

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
  birth_day smallint
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
    extract(day from a.birth_date)::smallint
  from public.profiles p
  left join public.applications a on a.profile_id = p.id
  where p.status = 'approved'
    and (public.is_approved() or public.is_leader())
  order by p.full_name;
$$;

revoke execute on function public.member_directory() from anon, public;
grant execute on function public.member_directory() to authenticated;
