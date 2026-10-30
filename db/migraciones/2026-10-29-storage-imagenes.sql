-- =============================================================================
-- Imágenes en Supabase Storage (sustituye a Cloudinary)
--
-- Aplícalo una vez por proyecto:
--   Supabase Studio → SQL Editor → pegar y ejecutar
-- o, con la CLI enlazada:
--   supabase db push
--
-- Crea tres buckets públicos de lectura y las políticas RLS mínimas:
--   - cualquiera puede leer (las fotos se sirven en la web pública);
--   - anónimos y autenticados pueden subir, igual que hoy con el preset sin
--     firmar de Cloudinary;
--   - solo el dueño del objeto puede actualizarlo o borrarlo.
--
-- Límites por archivo y tipo MIME se validan en el propio bucket, así que una
-- subida fuera de rango se rechaza antes de ocupar cuota.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('platillos',    'platillos',    true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('restaurantes', 'restaurantes', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('resenas',      'resenas',      true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de los tres buckets.
drop policy if exists "tuki lectura publica" on storage.objects;
create policy "tuki lectura publica" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('platillos', 'restaurantes', 'resenas'));

-- Subida. La primera carpeta del objeto debe coincidir con el bucket:
--   platillos/<uuid>.webp, restaurantes/<uuid>.webp, resenas/<uuid>.webp
drop policy if exists "tuki subida" on storage.objects;
create policy "tuki subida" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id in ('platillos', 'restaurantes', 'resenas')
    and (storage.foldername(name))[1] = bucket_id
  );

-- Reemplazo y borrado: solo el usuario que subió el archivo.
drop policy if exists "tuki actualizar propios" on storage.objects;
create policy "tuki actualizar propios" on storage.objects
  for update to authenticated
  using (bucket_id in ('platillos', 'restaurantes', 'resenas') and owner = auth.uid())
  with check (bucket_id in ('platillos', 'restaurantes', 'resenas') and owner = auth.uid());

drop policy if exists "tuki borrar propios" on storage.objects;
create policy "tuki borrar propios" on storage.objects
  for delete to authenticated
  using (bucket_id in ('platillos', 'restaurantes', 'resenas') and owner = auth.uid());
