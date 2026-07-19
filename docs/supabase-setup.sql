-- PlayerPG - installation Supabase pour un projet neuf
-- Ce script est idempotent pour les objets qu'il crée, mais ne supprime pas
-- d'anciennes policies portant d'autres noms.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on update cascade on delete cascade,
  username text not null unique check (char_length(btrim(username)) between 1 and 50),
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  role text not null default 'user' check (role in ('user', 'admin'))
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles(user_id) on update cascade on delete cascade,
  igdb_game_id bigint not null,
  game_name text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  constraint favorites_user_game_unique unique (user_id, igdb_game_id)
);

create table if not exists public.game_translations (
  igdb_game_id bigint primary key,
  summary_fr text,
  storyline_fr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glossary_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(btrim(title)) between 1 and 90),
  short_description text not null check (char_length(btrim(short_description)) between 1 and 220),
  detailed_description text not null check (char_length(btrim(detailed_description)) between 1 and 6000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  author_id uuid references public.profiles(user_id) on update cascade on delete set null,
  reviewed_by uuid references public.profiles(user_id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.glossary_entry_games (
  id uuid primary key default gen_random_uuid(),
  glossary_entry_id uuid not null
    references public.glossary_entries(id) on update cascade on delete cascade,
  igdb_game_id bigint not null,
  game_name text not null,
  cover_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  constraint glossary_entry_games_unique unique (glossary_entry_id, igdb_game_id)
);

create table if not exists public.glossary_entry_sources (
  id uuid primary key default gen_random_uuid(),
  glossary_entry_id uuid not null
    references public.glossary_entries(id) on update cascade on delete cascade,
  label text,
  url text not null check (url ~* '^https://[^[:space:]]+$' and char_length(url) <= 2048),
  created_at timestamptz not null default now(),
  constraint glossary_entry_sources_unique unique (glossary_entry_id, url)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.profiles(user_id) on update cascade on delete cascade,
  type text not null check (type in ('glossary_published', 'glossary_rejected')),
  title text not null,
  message text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists favorites_user_created_idx
  on public.favorites(user_id, created_at desc);
create index if not exists glossary_entries_status_title_idx
  on public.glossary_entries(status, title);
create index if not exists glossary_entries_author_published_idx
  on public.glossary_entries(author_id, published_at desc);
create index if not exists glossary_entry_games_entry_sort_idx
  on public.glossary_entry_games(glossary_entry_id, sort_order);
create index if not exists glossary_entry_sources_entry_created_idx
  on public.glossary_entry_sources(glossary_entry_id, created_at);
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

-- Maintient updated_at lors des modifications du glossaire.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists glossary_entries_set_updated_at on public.glossary_entries;
create trigger glossary_entries_set_updated_at
before update on public.glossary_entries
for each row execute function public.set_updated_at();

-- Fonction utilisée par le frontend pour afficher l'accès administrateur.
-- SECURITY DEFINER évite une récursion RLS sur profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS et privilèges
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.game_translations enable row level security;
alter table public.glossary_entries enable row level security;
alter table public.glossary_entry_games enable row level security;
alter table public.glossary_entry_sources enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated, service_role;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, username, email, avatar_url) on public.profiles to authenticated;
grant update (username, email, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (auth.uid() = user_id and role = 'user');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own
on public.favorites for select to authenticated
using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own
on public.favorites for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own
on public.favorites for delete to authenticated
using (auth.uid() = user_id);

-- Le cache IA est exclusivement lu et écrit par game_service.
revoke all on public.game_translations from anon, authenticated;
grant all on public.game_translations to service_role;

-- Le frontend lit les entrées publiées côté serveur. Ces policies permettent
-- aussi une lecture publique directe sans exposer les brouillons.
revoke all on public.glossary_entries from anon, authenticated;
revoke all on public.glossary_entry_games from anon, authenticated;
revoke all on public.glossary_entry_sources from anon, authenticated;
grant select on public.glossary_entries to anon, authenticated;
grant select on public.glossary_entry_games to anon, authenticated;
grant select on public.glossary_entry_sources to anon, authenticated;
grant all on public.glossary_entries to service_role;
grant all on public.glossary_entry_games to service_role;
grant all on public.glossary_entry_sources to service_role;

drop policy if exists glossary_entries_select_published on public.glossary_entries;
create policy glossary_entries_select_published
on public.glossary_entries for select to anon, authenticated
using (status = 'published');

drop policy if exists glossary_games_select_published on public.glossary_entry_games;
create policy glossary_games_select_published
on public.glossary_entry_games for select to anon, authenticated
using (
  exists (
    select 1 from public.glossary_entries
    where glossary_entries.id = glossary_entry_games.glossary_entry_id
      and glossary_entries.status = 'published'
  )
);

drop policy if exists glossary_sources_select_published on public.glossary_entry_sources;
create policy glossary_sources_select_published
on public.glossary_entry_sources for select to anon, authenticated
using (
  exists (
    select 1 from public.glossary_entries
    where glossary_entries.id = glossary_entry_sources.glossary_entry_id
      and glossary_entries.status = 'published'
  )
);

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage : bucket public, écriture limitée au dossier de l'utilisateur
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

