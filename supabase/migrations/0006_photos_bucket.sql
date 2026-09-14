-- 0006 — bucket de storage para as fotos que o casal sobe (capa + galeria).
-- Leitura pública (o site dos convidados renderiza as URLs); escrita restrita por
-- RLS à pasta do próprio dono ({auth.uid()}/...). Seguro para re-executar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-photos',
  'wedding-photos',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS em storage.objects: qualquer um lê este bucket público; só o dono da pasta
-- raiz ({auth.uid()}) escreve/atualiza/apaga os próprios objetos.
drop policy if exists wedding_photos_read on storage.objects;
create policy wedding_photos_read on storage.objects
  for select using (bucket_id = 'wedding-photos');

drop policy if exists wedding_photos_insert on storage.objects;
create policy wedding_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wedding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists wedding_photos_update on storage.objects;
create policy wedding_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wedding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists wedding_photos_delete on storage.objects;
create policy wedding_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wedding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
