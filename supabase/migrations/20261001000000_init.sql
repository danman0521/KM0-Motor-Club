-- Plataforma Neutro: esquema, permisos (RLS), funciones y buckets.
-- Los permisos se aplican aquí; la interfaz solo los refleja.

create type public.member_role as enum ('member', 'leader');
create type public.member_status as enum ('pending', 'approved', 'rejected');
create type public.suggestion_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  nickname text check (char_length(nickname) between 1 and 60),
  role public.member_role not null default 'member',
  status public.member_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  chronicle text,
  cover_photo_path text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null unique,
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index event_photos_event_idx on public.event_photos (event_id);

create table public.event_videos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text,
  created_at timestamptz not null default now(),
  unique (event_id, youtube_id)
);

create table public.featured_riders (
  id uuid primary key default gen_random_uuid(),
  month date not null unique check (extract(day from month) = 1),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 1000),
  photo_path text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '',
  tentative_date date,
  proposed_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.suggestion_status not null default 'pending',
  leader_note text,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones de rol (security definer para no entrar en recursión con RLS)
-- ---------------------------------------------------------------------------

create function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved'
  );
$$;

create function public.is_leader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved' and role = 'leader'
  );
$$;

-- ---------------------------------------------------------------------------
-- Perfil automático al registrarse: siempre member + pending
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, nickname)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    left(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Nadie cambia su propio rol o estado; un líder no se quita a sí mismo
-- ---------------------------------------------------------------------------

create function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Sin usuario (clave de servicio, seed, SQL directo): sin restricciones
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
    if not public.is_leader() then
      new.role := old.role;
      new.status := old.status;
    elsif old.id = (select auth.uid()) then
      raise exception 'Un líder no puede quitarse a sí mismo el liderazgo ni la aprobación'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.event_videos enable row level security;
alter table public.featured_riders enable row level security;
alter table public.suggestions enable row level security;

-- profiles: cada quien ve el suyo; los aprobados ven a los aprobados; los líderes ven todos
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (status = 'approved' and public.is_approved())
    or public.is_leader()
  );

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_leader())
  with check (id = (select auth.uid()) or public.is_leader());

-- events
create policy "events_select" on public.events
  for select to authenticated using (public.is_approved());
create policy "events_insert" on public.events
  for insert to authenticated with check (public.is_leader());
create policy "events_update" on public.events
  for update to authenticated using (public.is_leader()) with check (public.is_leader());
create policy "events_delete" on public.events
  for delete to authenticated using (public.is_leader());

-- event_photos
create policy "event_photos_select" on public.event_photos
  for select to authenticated using (public.is_approved());
create policy "event_photos_insert" on public.event_photos
  for insert to authenticated with check (public.is_leader());
create policy "event_photos_delete" on public.event_photos
  for delete to authenticated using (public.is_leader());

-- event_videos
create policy "event_videos_select" on public.event_videos
  for select to authenticated using (public.is_approved());
create policy "event_videos_insert" on public.event_videos
  for insert to authenticated with check (public.is_leader());
create policy "event_videos_delete" on public.event_videos
  for delete to authenticated using (public.is_leader());

-- featured_riders
create policy "featured_select" on public.featured_riders
  for select to authenticated using (public.is_approved());
create policy "featured_insert" on public.featured_riders
  for insert to authenticated with check (public.is_leader());
create policy "featured_update" on public.featured_riders
  for update to authenticated using (public.is_leader()) with check (public.is_leader());
create policy "featured_delete" on public.featured_riders
  for delete to authenticated using (public.is_leader());

-- suggestions: los miembros postulan (siempre pending y a su nombre); los líderes deciden
create policy "suggestions_select" on public.suggestions
  for select to authenticated using (public.is_approved());
create policy "suggestions_insert" on public.suggestions
  for insert to authenticated
  with check (
    public.is_approved()
    and proposed_by = (select auth.uid())
    and status = 'pending'
    and leader_note is null
    and event_id is null
  );
create policy "suggestions_update" on public.suggestions
  for update to authenticated using (public.is_leader()) with check (public.is_leader());

-- Las tablas privadas no se exponen a visitantes sin sesión
revoke all on public.profiles, public.events, public.event_photos, public.event_videos,
  public.featured_riders, public.suggestions from anon;

-- ---------------------------------------------------------------------------
-- Portada pública: solo columnas seguras
-- ---------------------------------------------------------------------------

create function public.public_upcoming_events()
returns table (title text, starts_at timestamptz, location text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.title, e.starts_at, e.location
  from public.events e
  where e.starts_at >= now()
  order by e.starts_at
  limit 3;
$$;

create function public.public_current_featured()
returns table (display_name text, reason text, photo_path text, month date)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.nickname, p.full_name), f.reason, f.photo_path, f.month
  from public.featured_riders f
  join public.profiles p on p.id = f.profile_id
  where f.month = date_trunc('month', now())::date;
$$;

grant execute on function public.public_upcoming_events() to anon, authenticated;
grant execute on function public.public_current_featured() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aprobar una sugerencia creando su evento, en una sola transacción.
-- Security invoker: las políticas RLS de arriba siguen aplicando.
-- ---------------------------------------------------------------------------

create function public.create_event_from_suggestion(
  p_suggestion uuid,
  p_title text,
  p_description text,
  p_location text,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_event uuid;
begin
  if not public.is_leader() then
    raise exception 'Solo los líderes pueden aprobar sugerencias' using errcode = '42501';
  end if;

  perform 1 from public.suggestions where id = p_suggestion and status = 'pending' for update;
  if not found then
    raise exception 'La sugerencia no existe o ya fue revisada' using errcode = 'P0002';
  end if;

  insert into public.events (title, description, location, starts_at)
  values (p_title, coalesce(p_description, ''), coalesce(p_location, ''), p_starts_at)
  returning id into v_event;

  update public.suggestions
  set status = 'approved', event_id = v_event
  where id = p_suggestion;

  return v_event;
end;
$$;

revoke execute on function public.create_event_from_suggestion(uuid, text, text, text, timestamptz) from anon, public;
grant execute on function public.create_event_from_suggestion(uuid, text, text, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-photos', 'event-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('featured', 'featured', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Fotos de eventos: las ven los miembros aprobados
create policy "event_photos_objects_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-photos' and public.is_approved());

-- El bucket "featured" es público por URL; esta política permite a los líderes listar y borrar
create policy "featured_objects_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'featured' and public.is_leader());

create policy "media_objects_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('event-photos', 'featured') and public.is_leader());

create policy "media_objects_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('event-photos', 'featured') and public.is_leader())
  with check (bucket_id in ('event-photos', 'featured') and public.is_leader());

create policy "media_objects_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('event-photos', 'featured') and public.is_leader());
