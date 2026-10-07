-- Ficha de postulación: datos personales y de seguridad que cada persona
-- llena al registrarse. Solo los ven la propia persona y los líderes.

create type public.blood_type as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

create table public.applications (
  profile_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  city text not null check (char_length(city) between 1 and 120),
  occupation text not null check (char_length(occupation) between 1 and 120),
  birth_date date not null check (birth_date > current_date - interval '110 years' and birth_date < current_date),
  phone text not null default '' check (char_length(phone) <= 40),
  other_club text not null default '' check (char_length(other_club) <= 120),
  blood_type public.blood_type not null,
  allergies text not null default '' check (char_length(allergies) <= 1000),
  medical_conditions text not null default '' check (char_length(medical_conditions) <= 1000),
  emergency_contact_name text not null check (char_length(emergency_contact_name) between 1 and 120),
  emergency_contact_phone text not null check (char_length(emergency_contact_phone) between 1 and 40),
  moto_photo_path text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- La foto de la moto vive en la carpeta del propio usuario
alter table public.applications
  add constraint applications_moto_photo_in_own_folder
  check (moto_photo_path is null or moto_photo_path like profile_id::text || '/%');

create trigger applications_touch
  before update on public.applications
  for each row execute function public.touch_updated_at();

alter table public.applications enable row level security;

-- Cada quien ve y edita su ficha (también antes de estar aprobado); los líderes ven todas
create policy "applications_select" on public.applications
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_leader());
create policy "applications_insert" on public.applications
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "applications_update" on public.applications
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

revoke all on public.applications from anon;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- Fotos de la moto: bucket privado; las ve el dueño y los líderes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applications', 'applications', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "applications_objects_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'applications'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_leader())
  );
create policy "applications_objects_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'applications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "applications_objects_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'applications' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'applications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "applications_objects_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'applications'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_leader())
  );

-- La foto de perfil ahora se sube desde la postulación, antes de estar aprobado:
-- cualquier cuenta con sesión puede escribir en su propia carpeta de avatars.
drop policy "avatars_objects_insert" on storage.objects;
drop policy "avatars_objects_update" on storage.objects;
drop policy "avatars_objects_delete" on storage.objects;

create policy "avatars_objects_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_objects_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_objects_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_leader())
  );
