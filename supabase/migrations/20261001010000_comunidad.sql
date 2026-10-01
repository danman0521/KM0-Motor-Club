-- Fase 2: foto de perfil, asistencia, calificaciones, comentarios y convenios.

-- ---------------------------------------------------------------------------
-- Foto de perfil
-- ---------------------------------------------------------------------------

alter table public.profiles add column avatar_path text;

-- La foto de un perfil vive en la carpeta de ese mismo usuario
alter table public.profiles
  add constraint profiles_avatar_in_own_folder
  check (avatar_path is null or avatar_path like id::text || '/%');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create function public.event_has_started(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.events where id = p_event and starts_at <= now());
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Asistencia: Voy / No voy, hasta que el evento empiece
-- ---------------------------------------------------------------------------

create type public.attendance_status as enum ('going', 'not_going');

create table public.event_attendance (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.attendance_status not null,
  updated_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create trigger event_attendance_touch
  before update on public.event_attendance
  for each row execute function public.touch_updated_at();

alter table public.event_attendance enable row level security;

create policy "attendance_select" on public.event_attendance
  for select to authenticated using (public.is_approved());
create policy "attendance_insert" on public.event_attendance
  for insert to authenticated
  with check (
    public.is_approved()
    and profile_id = (select auth.uid())
    and not public.event_has_started(event_id)
  );
create policy "attendance_update" on public.event_attendance
  for update to authenticated
  using (public.is_approved() and profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and not public.event_has_started(event_id));
create policy "attendance_delete" on public.event_attendance
  for delete to authenticated
  using (
    public.is_approved()
    and profile_id = (select auth.uid())
    and not public.event_has_started(event_id)
  );

-- ---------------------------------------------------------------------------
-- Calificaciones: 1 a 5 estrellas, solo cuando el evento ya empezó
-- ---------------------------------------------------------------------------

create table public.event_ratings (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create trigger event_ratings_touch
  before update on public.event_ratings
  for each row execute function public.touch_updated_at();

alter table public.event_ratings enable row level security;

create policy "ratings_select" on public.event_ratings
  for select to authenticated using (public.is_approved());
create policy "ratings_insert" on public.event_ratings
  for insert to authenticated
  with check (
    public.is_approved()
    and profile_id = (select auth.uid())
    and public.event_has_started(event_id)
  );
create policy "ratings_update" on public.event_ratings
  for update to authenticated
  using (public.is_approved() and profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.event_has_started(event_id));
create policy "ratings_delete" on public.event_ratings
  for delete to authenticated
  using (public.is_approved() and profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Comentarios: solo cuando el evento ya empezó; sin edición
-- ---------------------------------------------------------------------------

create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index event_comments_event_idx on public.event_comments (event_id, created_at);

alter table public.event_comments enable row level security;

create policy "comments_select" on public.event_comments
  for select to authenticated using (public.is_approved());
create policy "comments_insert" on public.event_comments
  for insert to authenticated
  with check (
    public.is_approved()
    and author_id = (select auth.uid())
    and public.event_has_started(event_id)
  );
-- El autor borra los suyos; un líder modera cualquiera
create policy "comments_delete" on public.event_comments
  for delete to authenticated
  using ((public.is_approved() and author_id = (select auth.uid())) or public.is_leader());

-- ---------------------------------------------------------------------------
-- Convenios con empresas
-- ---------------------------------------------------------------------------

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default '',
  benefit text not null check (char_length(benefit) between 1 and 300),
  description text not null default '',
  phone text not null default '',
  address text not null default '',
  website text check (website is null or website ~* '^https?://[^[:space:]]+$'),
  logo_path text,
  valid_until date,
  active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.partners enable row level security;

-- Los miembros ven los activos y vigentes; los líderes, todos
create policy "partners_select" on public.partners
  for select to authenticated
  using (
    public.is_leader()
    or (public.is_approved() and active and (valid_until is null or valid_until >= current_date))
  );
create policy "partners_insert" on public.partners
  for insert to authenticated with check (public.is_leader());
create policy "partners_update" on public.partners
  for update to authenticated using (public.is_leader()) with check (public.is_leader());
create policy "partners_delete" on public.partners
  for delete to authenticated using (public.is_leader());

revoke all on public.event_attendance, public.event_ratings, public.event_comments, public.partners from anon;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('partners', 'partners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Fotos de perfil: cada miembro aprobado escribe solo en su carpeta `<su id>/`
create policy "avatars_objects_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_leader())
  );
create policy "avatars_objects_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and public.is_approved()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatars_objects_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_approved()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatars_objects_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (public.is_approved() and (storage.foldername(name))[1] = (select auth.uid())::text)
      or public.is_leader()
    )
  );

-- Logos de convenios: solo líderes
create policy "partners_objects_select" on storage.objects
  for select to authenticated using (bucket_id = 'partners' and public.is_leader());
create policy "partners_objects_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'partners' and public.is_leader());
create policy "partners_objects_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'partners' and public.is_leader())
  with check (bucket_id = 'partners' and public.is_leader());
create policy "partners_objects_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'partners' and public.is_leader());
