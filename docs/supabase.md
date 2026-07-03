# Supabase

Supabase est utilise comme backend headless pour l'authentification, les profils, les favoris, les avatars, les roles et certaines donnees collaboratives.

## Tables principales

### `profiles`

Profil public et role applicatif de l'utilisateur.

Colonnes principales:

- `user_id` uuid, cle primaire, rattache a `auth.users.id`
- `username` text, unique
- `email` text, unique
- `avatar_url` text, nullable
- `created_at` timestamptz
- `role` text, `user` ou `admin`

Usage:

- Affichage du profil.
- Avatar dans le header.
- Gestion des roles dans `/admin`.
- Verification admin via `public.is_admin()`.

### `favorites`

Jeux sauvegardes par utilisateur.

Colonnes principales:

- `id` uuid
- `user_id` uuid
- `igdb_game_id` int8
- `game_name` text
- `cover_url` text
- `created_at` timestamptz

Contrainte conseillee:

```sql
unique (user_id, igdb_game_id)
```

Usage:

- Bouton favori sur les fiches.
- Liste des favoris sur le profil.
- Exclusion des favoris dans le chatbot.

### `game_translations`

Cache des traductions Mistral.

Colonnes principales:

- `igdb_game_id` int8
- `summary_fr` text
- `storyline_fr` text
- `created_at` timestamptz
- `updated_at` timestamptz

Usage:

- Eviter de retraduire une fiche deja traitee.
- Limiter les couts IA.

### `glossary_entries`

Propositions et entrees publiees du glossaire.

Colonnes principales:

- `id` uuid
- `slug` text, unique
- `title` text
- `short_description` text
- `detailed_description` text
- `status` text: `pending`, `published`, `rejected`
- `author_id` uuid
- `reviewed_by` uuid
- `created_at` timestamptz
- `updated_at` timestamptz
- `published_at` timestamptz

Usage:

- Futur glossaire collaboratif.
- Moderation admin.

### `glossary_entry_games`

Jeux liés a une entree du glossaire.

Colonnes principales:

- `id` uuid
- `glossary_entry_id` uuid
- `igdb_game_id` int8
- `game_name` text
- `cover_url` text
- `sort_order` int
- `created_at` timestamptz

Usage:

- Jeux mis en avant dans une page de detail du glossaire.

### `glossary_entry_sources`

Sources justificatives liees a une entree du glossaire.

Colonnes principales:

- `id` uuid
- `glossary_entry_id` uuid
- `label` text, nullable
- `url` text
- `created_at` timestamptz

Regles:

- Une proposition doit avoir au moins une source.
- Les URLs doivent utiliser `https://`.
- Les liens sont affiches avec `target="_blank"` et `rel="noopener noreferrer nofollow"`.

Usage:

- Permettre a l'admin de verifier une proposition avant publication.
- Rendre les pages detaillees du glossaire plus fiables.

### `notifications`

Notifications applicatives rattachees au profil utilisateur.

Colonnes conseillees:

- `id` uuid
- `user_id` uuid
- `type` text
- `title` text
- `message` text
- `href` text, nullable
- `read_at` timestamptz, nullable
- `created_at` timestamptz

Requete de creation:

```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('glossary_published', 'glossary_rejected')),
  title text not null,
  message text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.notifications to service_role;
grant select, update on public.notifications to authenticated;
```

Usage:

- Notifier un contributeur quand une entree de glossaire est publiee ou refusee.
- Afficher les notifications dans la page profil.

## Row Level Security

RLS doit rester active sur les tables manipulees depuis le navigateur.

Regle generale:

- Les utilisateurs lisent/modifient uniquement leurs propres donnees.
- Les entrees publiees sont lisibles publiquement.
- Les admins peuvent lire/moderer les propositions.
- Les routes serveur peuvent utiliser `SUPABASE_SERVICE_ROLE_KEY` pour les actions sensibles.

## Fonction `is_admin`

La fonction `public.is_admin()` sert a verifier le role du user courant dans Supabase et le frontend.

Principe:

```sql
select exists (
  select 1
  from public.profiles
  where user_id = auth.uid()
    and role = 'admin'
);
```

## Storage

Bucket: `avatars`

Usage:

- Upload de l'avatar utilisateur.
- Affichage dans le profil et le header.
- Suppression lors de la suppression du compte.

Attention:

- Les policies Storage doivent autoriser l'utilisateur a gerer son propre dossier.
- Un bucket public facilite l'affichage des avatars, mais il faut eviter une policy trop large de listage global.

## Service role

La service role key contourne RLS. Elle doit rester uniquement cote serveur:

- `frontend/app/api/admin/route.ts`
- `frontend/app/api/account/route.ts`
- `game_service/services/supabaseRestService.js`

Ne jamais l'utiliser dans un composant client.
