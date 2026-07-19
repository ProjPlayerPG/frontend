-- Tests d’intégration des permissions et policies critiques de PlayerPG.
-- La moindre régression interrompt la commande avec une exception SQL.

do $$
declare
  public_policy_count integer;
  avatar_policy_count integer;
begin
  if not has_column_privilege('authenticated', 'public.profiles', 'username', 'UPDATE') then
    raise exception 'authenticated doit pouvoir modifier profiles.username';
  end if;

  if not has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE') then
    raise exception 'authenticated doit pouvoir modifier profiles.avatar_url';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'régression critique : authenticated peut modifier profiles.role';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'role', 'INSERT') then
    raise exception 'régression critique : authenticated peut choisir profiles.role';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'DELETE') then
    raise exception 'authenticated ne doit pas supprimer directement un profil';
  end if;

  if not has_table_privilege('service_role', 'public.profiles', 'DELETE') then
    raise exception 'service_role doit pouvoir supprimer un profil via la route serveur';
  end if;

  if not has_table_privilege('authenticated', 'public.notifications', 'DELETE') then
    raise exception 'authenticated doit pouvoir supprimer ses propres notifications';
  end if;

  if has_schema_privilege('authenticated', 'public', 'CREATE') then
    raise exception 'authenticated ne doit pas créer d’objets dans public';
  end if;

  if not has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') then
    raise exception 'authenticated doit pouvoir appeler is_admin()';
  end if;

  if has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') then
    raise exception 'anon ne doit pas pouvoir appeler is_admin()';
  end if;

  select count(*)
  into public_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename in (
      'profiles',
      'favorites',
      'game_translations',
      'glossary_entries',
      'glossary_entry_games',
      'glossary_entry_sources',
      'notifications'
    );

  if public_policy_count <> 12 then
    raise exception '12 policies publiques attendues, % trouvées', public_policy_count;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname in (
      'profiles_username_length_check',
      'profiles_user_id_fkey',
      'glossary_entries_title_length_check',
      'glossary_entries_short_description_length_check',
      'glossary_entries_detailed_description_length_check',
      'glossary_entries_author_id_fkey',
      'glossary_entries_reviewed_by_fkey',
      'glossary_entry_games_sort_order_check',
      'glossary_entry_sources_url_format',
      'notifications_user_id_fkey'
    )
      and not convalidated
  ) then
    raise exception 'toutes les contraintes PlayerPG doivent être validées';
  end if;

  select count(*)
  into avatar_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in (
      'avatars_select_own',
      'avatars_insert_own',
      'avatars_update_own',
      'avatars_delete_own'
    );

  if avatar_policy_count <> 4 then
    raise exception '4 policies avatar attendues, % trouvées', avatar_policy_count;
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'avatars'
      and public
      and file_size_limit = 2097152
      and allowed_mime_types @> array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
      ]::text[]
  ) then
    raise exception 'configuration du bucket avatars invalide';
  end if;
end;
$$;
