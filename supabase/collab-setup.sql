-- Notedo · setup de COLABORAÇÃO de mapas mentais.
-- Rode este arquivo INTEIRO no SQL Editor do Supabase (botão Run, sem nada
-- selecionado). É idempotente — pode rodar quantas vezes quiser.
-- Depois disso, o "Compartilhar" e o "Entrar em mapa compartilhado" funcionam.

-- 1) Código de convite no mapa
alter table public.mindmaps add column if not exists share_token text;
create unique index if not exists mindmaps_share_token
  on public.mindmaps (share_token) where share_token is not null;

-- 2) Tabela de colaboradores + RLS
create table if not exists public.mindmap_collaborators (
  mindmap_id  text not null references public.mindmaps(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'editor',
  name        text,
  joined_at   timestamptz not null default now(),
  primary key (mindmap_id, user_id)
);
create index if not exists mindmap_collab_user on public.mindmap_collaborators (user_id);
alter table public.mindmap_collaborators enable row level security;

drop policy if exists collab_select on public.mindmap_collaborators;
create policy collab_select on public.mindmap_collaborators for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.mindmaps m
      where m.id = mindmap_id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists collab_owner_delete on public.mindmap_collaborators;
create policy collab_owner_delete on public.mindmap_collaborators for delete
  using (
    exists (
      select 1 from public.mindmaps m
      where m.id = mindmap_id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists collab_self_delete on public.mindmap_collaborators;
create policy collab_self_delete on public.mindmap_collaborators for delete
  using (user_id = (select auth.uid()));

-- 3) Função de acesso (dono OU colaborador). SECURITY DEFINER evita recursão de
--    RLS e deixa as políticas de storage simples.
create or replace function public.can_access_mindmap(p_map_id text)
returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.mindmaps m
    where m.id = p_map_id
      and (
        m.user_id = auth.uid()
        or exists (
          select 1 from public.mindmap_collaborators c
          where c.mindmap_id = m.id and c.user_id = auth.uid()
        )
      )
  );
$$;
grant execute on function public.can_access_mindmap(text) to authenticated;

-- 4) RLS do mapa: dono OU colaborador (substitui own_rows só pra mindmaps)
drop policy if exists own_rows on public.mindmaps;
drop policy if exists mindmap_access on public.mindmaps;
create policy mindmap_access on public.mindmaps for all
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.mindmap_collaborators c
      where c.mindmap_id = id and c.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.mindmap_collaborators c
      where c.mindmap_id = id and c.user_id = (select auth.uid())
    )
  );

-- 5) Entrar pelo código (RPC). #variable_conflict use_column resolve a colisão
--    entre os nomes de saída e as colunas, evitando erro de ambiguidade.
create or replace function public.join_mindmap_by_token(p_token text, p_name text default null)
returns table (mindmap_id text, title text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_id text; v_title text; v_owner uuid;
begin
  select m.id, m.title, m.user_id into v_id, v_title, v_owner
    from public.mindmaps m
    where m.share_token = p_token and m.deleted_at is null and m.trashed_at is null;
  if v_id is null then
    raise exception 'Código inválido ou mapa indisponível.';
  end if;
  if v_owner <> auth.uid() then
    insert into public.mindmap_collaborators (mindmap_id, user_id, name)
      values (v_id, auth.uid(), p_name)
      on conflict (mindmap_id, user_id)
        do update set name = coalesce(excluded.name, public.mindmap_collaborators.name);
  end if;
  return query select v_id, v_title;
end $$;
grant execute on function public.join_mindmap_by_token(text, text) to authenticated;

-- 6) Bucket dos slides + acesso pros colaboradores
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mindmap-slides', 'mindmap-slides', false, 26214400,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists mindmap_slides_collab_select on storage.objects;
create policy mindmap_slides_collab_select on storage.objects for select
  using (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );

drop policy if exists mindmap_slides_collab_insert on storage.objects;
create policy mindmap_slides_collab_insert on storage.objects for insert
  with check (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );

drop policy if exists mindmap_slides_collab_update on storage.objects;
create policy mindmap_slides_collab_update on storage.objects for update
  using (
    bucket_id = 'mindmap-slides'
    and public.can_access_mindmap((storage.foldername(name))[2])
  );

select 'setup ok' as status;
