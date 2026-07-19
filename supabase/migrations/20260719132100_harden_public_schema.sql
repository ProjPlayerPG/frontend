-- Aligne le schema public existant avec les garanties documentees par PlayerPG.
-- La migration conserve les donnees et remplace les anciens droits et policies.

-- ---------------------------------------------------------------------------
-- Types, contraintes et relations
-- ---------------------------------------------------------------------------

alter table public.profiles
  alter column user_id drop default;

alter table public.favorites
  alter column igdb_game_id type bigint using igdb_game_id::bigint;

alter table public.game_translations
  alter column igdb_game_id type bigint using igdb_game_id::bigint;

alter table public.glossary_entries
  alter column author_id drop not null;

alter table public.profiles
  drop constraint if exists profiles_username_length_check;
alter table public.profiles
  add constraint profiles_username_length_check
  check (char_length(btrim(username)) between 1 and 50) not valid;

alter table public.glossary_entries
  drop constraint if exists glossary_entries_title_length_check,
  drop constraint if exists glossary_entries_short_description_length_check,
  drop constraint if exists glossary_entries_detailed_description_length_check;
alter table public.glossary_entries
  add constraint glossary_entries_title_length_check
    check (char_length(btrim(title)) between 1 and 90) not valid,
  add constraint glossary_entries_short_description_length_check
    check (char_length(btrim(short_description)) between 1 and 220) not valid,
  add constraint glossary_entries_detailed_description_length_check
    check (char_length(btrim(detailed_description)) between 1 and 6000) not valid;

alter table public.glossary_entry_games
  drop constraint if exists glossary_entry_games_sort_order_check;
alter table public.glossary_entry_games
  add constraint glossary_entry_games_sort_order_check
  check (sort_order >= 0) not valid;

alter table public.glossary_entry_sources
  drop constraint if exists glossary_entry_sources_url_format;
alter table public.glossary_entry_sources
  add constraint glossary_entry_sources_url_format
  check (
    url ~* '^https://[^[:space:]]+$'
    and char_length(url) <= 2048
  ) not valid;

alter table public.profiles
  drop constraint if exists profiles_user_id_fkey;
alter table public.profiles
  add constraint profiles_user_id_fkey
  foreign key (user_id) references auth.users(id)
  on update cascade on delete cascade not valid;

alter table public.glossary_entries
  drop constraint if exists glossary_entries_author_id_fkey,
  drop constraint if exists glossary_entries_reviewed_by_fkey;
alter table public.glossary_entries
  add constraint glossary_entries_author_id_fkey
    foreign key (author_id) references public.profiles(user_id)
    on update cascade on delete set null not valid,
  add constraint glossary_entries_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles(user_id)
    on update cascade on delete set null not valid;

alter table public.glossary_entry_games
  drop constraint if exists glossary_entry_games_glossary_entry_id_fkey;
alter table public.glossary_entry_games
  add constraint glossary_entry_games_glossary_entry_id_fkey
  foreign key (glossary_entry_id) references public.glossary_entries(id)
  on update cascade on delete cascade not valid;

alter table public.glossary_entry_sources
  drop constraint if exists glossary_entry_sources_glossary_entry_id_fkey;
alter table public.glossary_entry_sources
  add constraint glossary_entry_sources_glossary_entry_id_fkey
  foreign key (glossary_entry_id) references public.glossary_entries(id)
  on update cascade on delete cascade not valid;

alter table public.notifications
  drop constraint if exists notifications_user_id_fkey;
alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles(user_id)
  on update cascade on delete cascade not valid;

alter table public.profiles
  validate constraint profiles_username_length_check,
  validate constraint profiles_user_id_fkey;
alter table public.glossary_entries
  validate constraint glossary_entries_title_length_check,
  validate constraint glossary_entries_short_description_length_check,
  validate constraint glossary_entries_detailed_description_length_check,
  validate constraint glossary_entries_author_id_fkey,
  validate constraint glossary_entries_reviewed_by_fkey;
alter table public.glossary_entry_games
  validate constraint glossary_entry_games_sort_order_check,
  validate constraint glossary_entry_games_glossary_entry_id_fkey;
alter table public.glossary_entry_sources
  validate constraint glossary_entry_sources_url_format,
  validate constraint glossary_entry_sources_glossary_entry_id_fkey;
alter table public.notifications
  validate constraint notifications_user_id_fkey;

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

-- ---------------------------------------------------------------------------
-- Fonctions et privileges par defaut
-- ---------------------------------------------------------------------------

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

revoke all on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;

revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Suppression des anciennes policies
-- ---------------------------------------------------------------------------

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles',
        'favorites',
        'game_translations',
        'glossary_entries',
        'glossary_entry_games',
        'glossary_entry_sources',
        'notifications'
      ])
  loop
    execute format(
      'drop policy %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.game_translations enable row level security;
alter table public.glossary_entries enable row level security;
alter table public.glossary_entry_games enable row level security;
alter table public.glossary_entry_sources enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Profils : ecriture limitee aux colonnes non sensibles
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, username, email, avatar_url) on public.profiles to authenticated;
grant update (username, email, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_select_own
on public.profiles for select to authenticated
using (auth.uid() = user_id);

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (auth.uid() = user_id and role = 'user');

create policy profiles_update_own
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Favoris : acces limite au proprietaire.
revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

create policy favorites_select_own
on public.favorites for select to authenticated
using (auth.uid() = user_id);

create policy favorites_insert_own
on public.favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy favorites_delete_own
on public.favorites for delete to authenticated
using (auth.uid() = user_id);

-- Cache de traduction : acces reserve au service serveur.
revoke all on public.game_translations from anon, authenticated;
grant all on public.game_translations to service_role;

-- Glossaire : lecture publique des publications, ecriture via le serveur.
revoke all on public.glossary_entries from anon, authenticated;
revoke all on public.glossary_entry_games from anon, authenticated;
revoke all on public.glossary_entry_sources from anon, authenticated;
grant select on public.glossary_entries to anon, authenticated;
grant select on public.glossary_entry_games to anon, authenticated;
grant select on public.glossary_entry_sources to anon, authenticated;
grant all on public.glossary_entries to service_role;
grant all on public.glossary_entry_games to service_role;
grant all on public.glossary_entry_sources to service_role;

create policy glossary_entries_select_published
on public.glossary_entries for select to anon, authenticated
using (status = 'published');

create policy glossary_games_select_published
on public.glossary_entry_games for select to anon, authenticated
using (
  exists (
    select 1
    from public.glossary_entries
    where glossary_entries.id = glossary_entry_games.glossary_entry_id
      and glossary_entries.status = 'published'
  )
);

create policy glossary_sources_select_published
on public.glossary_entry_sources for select to anon, authenticated
using (
  exists (
    select 1
    from public.glossary_entries
    where glossary_entries.id = glossary_entry_sources.glossary_entry_id
      and glossary_entries.status = 'published'
  )
);

-- Notifications : lecture et acquittement limites au destinataire.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

create policy notifications_select_own
on public.notifications for select to authenticated
using (auth.uid() = user_id);

create policy notifications_update_own
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
