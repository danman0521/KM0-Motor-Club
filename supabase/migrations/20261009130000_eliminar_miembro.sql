-- Eliminación total de un miembro. Borrar su cuenta de autenticación elimina en
-- cascada su perfil y todos sus datos personales (ficha, motos, asistencias,
-- calificaciones, comentarios, sugerencias) y sus archivos. El contenido del
-- club que creó (eventos, anuncios, convenios, destacados, fotos) se conserva
-- con el autor en nulo, tal como lo definen las claves foráneas.
--
-- Solo un líder puede ejecutarla y nunca sobre su propia cuenta.

create function public.delete_member(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_leader() then
    raise exception 'Solo un líder puede eliminar miembros.' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception 'No puedes eliminar tu propia cuenta.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'El miembro no existe.';
  end if;

  -- Archivos propios del usuario: su carpeta dentro de cada bucket
  delete from storage.objects
  where bucket_id in ('avatars', 'motorcycles', 'applications')
    and (storage.foldername(name))[1] = target::text;

  -- Borrar la cuenta de auth elimina en cascada el perfil y sus datos personales
  delete from auth.users where id = target;
end;
$$;

revoke execute on function public.delete_member(uuid) from anon, public;
grant execute on function public.delete_member(uuid) to authenticated;
