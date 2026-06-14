-- Notedo — Supabase Storage para slides de mapas mentais (importação do Canva).
-- Rodar no SQL Editor do Supabase DEPOIS do schema.sql.
--
-- Bucket privado `mindmap-slides`. Caminho dos objetos:
--   <user_id>/<map_id>/<node_id>.png
-- A 1ª pasta (storage.foldername(name))[1] é o uid do dono — base do RLS.
-- Leitura/escrita só do próprio usuário; sem acesso público.

-- ─────────────────────────────────────────────────────────────────────────
-- Bucket (idempotente). 25 MB por arquivo; só imagens.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mindmap-slides',
  'mindmap-slides',
  false,
  26214400,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────
-- Políticas RLS em storage.objects: cada usuário só vê/grava a própria pasta.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists mindmap_slides_select on storage.objects;
drop policy if exists mindmap_slides_insert on storage.objects;
drop policy if exists mindmap_slides_update on storage.objects;
drop policy if exists mindmap_slides_delete on storage.objects;

create policy mindmap_slides_select on storage.objects for select
  using (
    bucket_id = 'mindmap-slides'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy mindmap_slides_insert on storage.objects for insert
  with check (
    bucket_id = 'mindmap-slides'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy mindmap_slides_update on storage.objects for update
  using (
    bucket_id = 'mindmap-slides'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'mindmap-slides'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy mindmap_slides_delete on storage.objects for delete
  using (
    bucket_id = 'mindmap-slides'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Colaboração: quem tem acesso ao mapa (dono OU colaborador) também acessa os
-- slides dele. A 2ª pasta do caminho (<user>/<map>/<node>.png) é o map_id.
-- Usa public.can_access_mindmap (definida no schema.sql) pra evitar subselects
-- aninhados. Idempotente. Combina com as políticas acima por OR.
-- IMPORTANTE: rodar schema.sql ANTES (cria a função e a tabela de colaboradores).
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists mindmap_slides_collab_select on storage.objects;
drop policy if exists mindmap_slides_collab_insert on storage.objects;
drop policy if exists mindmap_slides_collab_update on storage.objects;

create policy mindmap_slides_collab_select on storage.objects for select
  using (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );

create policy mindmap_slides_collab_insert on storage.objects for insert
  with check (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );

create policy mindmap_slides_collab_update on storage.objects for update
  using (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );
