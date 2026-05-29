-- Notedo — schema + RLS para sync (rodar no SQL Editor do Supabase).
-- PKs em text (cuid local). user_id uuid -> auth.users. updated_at/deleted_at
-- (timestamptz) em todas as tabelas pro motor de sync (LWW + tombstones).
-- IMPORTANTE: sem trigger de updated_at — o CLIENTE é dono do timestamp (LWW).

-- ─────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.subjects (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null,
  icon        text,
  priority    text not null default 'MEDIUM',
  progress    double precision not null default 0,
  tags        jsonb not null default '[]'::jsonb,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.topics (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  text not null,
  parent_id   text,
  title       text not null,
  content     jsonb,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.sessions (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  subject_id       text,
  topic_id         text,
  mode             text not null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_seconds integer not null default 0,
  notes            text,
  focus_score      integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.goals (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  metric      text not null,
  target      double precision not null,
  label       text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.reviews (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject_id    text,
  title         text not null,
  scheduled_at  timestamptz not null,
  completed_at  timestamptz,
  interval      integer not null default 1,
  ease          double precision not null default 2.5,
  status        text not null default 'PENDING',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.flashcards (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  front        text not null,
  back         text not null,
  deck         text,
  ease         double precision not null default 2.5,
  interval     integer not null default 1,
  next_review  timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table if not exists public.events (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  text,
  type        text not null,
  title       text not null,
  notes       text,
  date        timestamptz not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.grades (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  text not null,
  title       text not null,
  type        text not null,
  score       double precision not null,
  max_score   double precision not null,
  weight      double precision not null,
  date        timestamptz not null,
  comments    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Perfil 1:1 com auth.users (id = uuid do usuário).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Você',
  email       text,
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────
-- Índices (pull por watermark: where user_id = ? and updated_at > ?)
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists subjects_user_updated   on public.subjects   (user_id, updated_at);
create index if not exists topics_user_updated      on public.topics     (user_id, updated_at);
create index if not exists sessions_user_updated    on public.sessions   (user_id, updated_at);
create index if not exists goals_user_updated       on public.goals      (user_id, updated_at);
create index if not exists reviews_user_updated     on public.reviews    (user_id, updated_at);
create index if not exists flashcards_user_updated  on public.flashcards (user_id, updated_at);
create index if not exists events_user_updated      on public.events     (user_id, updated_at);
create index if not exists grades_user_updated      on public.grades     (user_id, updated_at);
create index if not exists profiles_updated         on public.profiles   (id, updated_at);

-- ─────────────────────────────────────────────────────────────────────────
-- Row-Level Security: cada usuário só enxerga as próprias linhas.
-- (select auth.uid()) em subselect = cacheado por statement (perf).
-- NÃO filtrar deleted_at no RLS: o pull precisa enxergar tombstones.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['subjects','topics','sessions','goals','reviews','flashcards','events','grades']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format(
      'create policy own_rows on public.%I for all
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()));', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for all
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- (Fase 4) LWW no servidor: upsert que só sobrescreve se vier mais novo.
-- Deixe comentado por enquanto; ativamos quando o sync básico estiver de pé.
-- ─────────────────────────────────────────────────────────────────────────
-- create or replace function public.upsert_if_newer(_table text, _rows jsonb) ...
