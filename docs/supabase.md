# Supabase

Supabase est le backend headless de PlayerPG pour l'authentification, les profils, les favoris, les rôles, le cache des traductions, le glossaire, les notifications et les avatars.

Le schéma est versionné dans `supabase/migrations/`. Une base locale complète est reconstruite avec `npx supabase db reset`; un projet distant reçoit uniquement les migrations manquantes avec `npx supabase db push`. Le parcours complet est détaillé dans le [guide d'installation](installation.md).

[`supabase-setup.sql`](supabase-setup.sql) reste une vue consolidée destinée à la lecture. En cas d'écart, les migrations sont la source de vérité.

La Data API doit être active pour le schéma `public`. L'exposition automatique des nouvelles tables peut rester désactivée : le script attribue explicitement chaque privilège.

## Migrations et collaboration

Les migrations déjà partagées ou appliquées ne sont jamais réécrites. Chaque évolution du schéma, des contraintes, des privilèges ou des policies reçoit un nouveau fichier horodaté :

```bash
npx supabase migration new nom_du_changement
npx supabase db reset
npx supabase db push --dry-run
npx supabase db push
```

Après un changement récupéré depuis Git, `npx supabase db reset` vérifie que toute l'histoire peut être rejouée sur une base locale vierge. Une seule personne ou le pipeline de déploiement doit pousser les migrations distantes à la fois.

## Modèle de données

### `profiles`

Profil applicatif lié à `auth.users`.

| Colonne | Type | Règle |
| --- | --- | --- |
| `user_id` | `uuid` | clé primaire, FK vers `auth.users.id`, `ON DELETE CASCADE` |
| `username` | `text` | obligatoire, unique |
| `email` | `text` | obligatoire, unique |
| `avatar_url` | `text` | nullable |
| `created_at` | `timestamptz` | `now()` |
| `role` | `text` | `user` par défaut, ou `admin` |

Le profil est créé par le frontend après l'obtention d'une session Supabase. La suppression du compte Auth supprime ensuite le profil et ses données dépendantes grâce aux clés étrangères.

Sécurité : un utilisateur peut lire son profil et modifier uniquement `username`, `email` et `avatar_url`. La colonne `role` n'est pas accordée en écriture au rôle `authenticated`, ce qui empêche une auto-promotion par appel REST.

### `favorites`

Jeux sauvegardés par utilisateur.

| Colonne | Type | Règle |
| --- | --- | --- |
| `id` | `uuid` | clé primaire, `gen_random_uuid()` |
| `user_id` | `uuid` | FK vers `profiles.user_id`, `ON DELETE CASCADE` |
| `igdb_game_id` | `bigint` | identifiant IGDB |
| `game_name` | `text` | nom affiché |
| `cover_url` | `text` | nullable |
| `created_at` | `timestamptz` | `now()` |

La contrainte `unique (user_id, igdb_game_id)` empêche les doublons tout en autorisant plusieurs favoris par utilisateur. RLS limite la lecture, l'ajout et la suppression au propriétaire. `game_service` utilise la service role key pour exclure ces jeux des recommandations.

### `game_translations`

Cache persistant des traductions Mistral.

| Colonne | Type | Règle |
| --- | --- | --- |
| `igdb_game_id` | `bigint` | clé primaire |
| `summary_fr` | `text` | nullable |
| `storyline_fr` | `text` | nullable |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | date du dernier traitement |

Cette table est réservée à `game_service`. Aucun accès direct n'est accordé à `anon` ou `authenticated`.

### `glossary_entries`

Contenu principal du glossaire collaboratif.

| Colonne | Type | Règle |
| --- | --- | --- |
| `id` | `uuid` | clé primaire |
| `slug` | `text` | obligatoire, unique |
| `title` | `text` | 1 à 90 caractères |
| `short_description` | `text` | 1 à 220 caractères |
| `detailed_description` | `text` | 1 à 6 000 caractères |
| `status` | `text` | `pending`, `published` ou `rejected` |
| `author_id` | `uuid` | FK vers `profiles`, `ON DELETE SET NULL` |
| `reviewed_by` | `uuid` | admin modérateur, nullable |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | maintenu par trigger |
| `published_at` | `timestamptz` | nullable |

Une contribution utilisateur commence en `pending`. Une contribution faite par un admin est publiée directement. La route `/api/admin` est la seule à modifier le statut et le rôle utilisateur.

### `glossary_entry_games`

Jeux IGDB illustrant une entrée. La clé étrangère vers `glossary_entries` utilise `ON DELETE CASCADE`. La combinaison `(glossary_entry_id, igdb_game_id)` est unique et `sort_order` conserve l'ordre choisi dans le formulaire.

### `glossary_entry_sources`

Sources justificatives d'une entrée. Chaque URL doit commencer par `https://`, ne pas dépasser 2 048 caractères et être unique dans une même contribution. La route serveur refuse également localhost et les plages d'adresses privées.

Le serveur impose au moins une source lors de la soumission. Les liens affichés utilisent `noopener`, `noreferrer` et `nofollow`.

### `glossary_tags` et `glossary_entry_tags`

La migration [`20260907143506_add_glossary_tags.sql`](../supabase/migrations/20260907143506_add_glossary_tags.sql) ajoute un vocabulaire contrôlé pour catégoriser le glossaire. Elle a été appliquée au projet Supabase distant avec l'outil de migration MCP, puis contrôlée dans l'historique des migrations.

#### Table `glossary_tags`

| Colonne | Type | Règle |
| --- | --- | --- |
| `id` | `uuid` | clé primaire, `gen_random_uuid()` |
| `slug` | `text` | unique, 1 à 50 caractères, minuscules/chiffres/tirets uniquement |
| `name` | `text` | unique, 2 à 30 caractères après suppression des espaces extérieurs |
| `created_at` | `timestamptz` | `now()` |

La migration crée huit catégories initiales : Combat, Équipement, Exploration, Multijoueur, Narration, Personnages, Progression et Technique. L'ajout utilise `ON CONFLICT (slug) DO NOTHING` afin de ne pas dupliquer une catégorie déjà présente lors d'une reconstruction contrôlée du schéma.

#### Table `glossary_entry_tags`

| Colonne | Type | Règle |
| --- | --- | --- |
| `glossary_entry_id` | `uuid` | FK vers `glossary_entries.id`, cascade à la mise à jour et à la suppression |
| `tag_id` | `uuid` | FK vers `glossary_tags.id`, cascade à la mise à jour, suppression restreinte |
| `created_at` | `timestamptz` | `now()` |

La clé primaire composite `(glossary_entry_id, tag_id)` empêche d'affecter deux fois le même tag à une entrée. L'index `(tag_id, glossary_entry_id)` accélère le filtrage du glossaire par catégorie. La suppression d'une entrée supprime automatiquement ses associations ; un tag encore utilisé ne peut pas être supprimé.

L'application impose entre un et trois tags par proposition. Cette règle est validée par les routes serveur avant l'écriture ; elle ne dépend pas du client. La création et la gestion des tags passent par `/api/admin`, tandis que `/api/glossary` enregistre les associations d'une nouvelle proposition avec la service role key.

#### RLS des tags

RLS est activée sur les deux tables. Les privilèges SQL et les policies se complètent :

| Table | Rôle | Privilèges SQL | Policy et portée |
| --- | --- | --- | --- |
| `glossary_tags` | `anon`, `authenticated` | `SELECT` uniquement | `glossary_tags_select_public` autorise la lecture de tout le vocabulaire |
| `glossary_entry_tags` | `anon`, `authenticated` | `SELECT` uniquement | `glossary_entry_tags_select_published` autorise une association uniquement si l'entrée liée est `published` |
| les deux tables | `service_role` | tous les privilèges | les écritures restent réservées aux routes serveur de confiance |

Les associations d'une proposition `pending` ou `rejected` ne sont donc jamais exposées par la Data API publique. Le navigateur peut charger les catégories disponibles, mais il ne peut ni créer un tag, ni modifier une association, ni supprimer une catégorie. La service role key contourne les policies RLS et ne doit jamais être envoyée au client.

Contrôles effectués après déploiement : présence des deux tables et de leurs clés étrangères, huit lignes dans `glossary_tags`, RLS active, policies de lecture présentes, `SELECT` seul pour `anon` et `authenticated`, et droits complets pour `service_role`.

### `notifications`

Notifications générées après modération du glossaire.

| Colonne | Type | Règle |
| --- | --- | --- |
| `id` | `uuid` | clé primaire |
| `user_id` | `uuid` | destinataire, FK vers `profiles`, cascade |
| `type` | `text` | `glossary_published` ou `glossary_rejected` |
| `title` | `text` | libellé court |
| `message` | `text` | contenu affiché |
| `href` | `text` | lien interne nullable |
| `read_at` | `timestamptz` | nullable, renseigné à la lecture |
| `created_at` | `timestamptz` | `now()` |

L'utilisateur peut lire ses notifications, mettre à jour uniquement `read_at` et supprimer uniquement ses propres notifications. La création reste réservée à la route admin avec la service role key.

## RLS et service role

RLS est activée sur toutes les tables publiques. Le script applique le principe suivant :

- `profiles`, `favorites` et `notifications` : accès limité au propriétaire ;
- glossaire : seules les entrées publiées et leurs relations sont lisibles publiquement ; le vocabulaire des tags est public ;
- `game_translations` : accès serveur uniquement ;
- administration, modération et création du glossaire : routes Next.js authentifiées utilisant la service role key.

Pour les tags en particulier, le vocabulaire est public afin d'alimenter les filtres et le formulaire. Les associations héritent de la visibilité de leur entrée : seule une entrée `published` rend ses tags consultables publiquement. Les policies exactes sont détaillées dans la section [`glossary_tags` et `glossary_entry_tags`](#glossary_tags-et-glossary_entry_tags).

La service role key contourne RLS, mais elle a toujours besoin des privilèges SQL sur les tables. Le script lui accorde donc explicitement les droits nécessaires. Elle doit rester exclusivement dans les variables serveur du frontend et de `game_service`.

## Fonction `is_admin()`

`public.is_admin()` vérifie si l'utilisateur de la session courante possède `profiles.role = 'admin'`. Elle est déclarée `SECURITY DEFINER` pour éviter une récursion avec la policy RLS de `profiles`.

Le SQL Editor n'envoie pas le JWT du navigateur. `select public.is_admin();` y renvoie donc normalement `false`, même si une ligne admin existe. Pour promouvoir le premier admin :

```sql
update public.profiles
set role = 'admin'
where email = 'adresse@example.com';
```

Le compte doit s'être connecté au moins une fois afin que sa ligne `profiles` existe.

## Storage `avatars`

Le bucket `avatars` est public pour permettre l'affichage via `getPublicUrl()`. Les écritures restent privées : chaque utilisateur ne peut gérer que le dossier dont le premier segment correspond à son UUID.

Format attendu :

```text
avatars/<auth.uid()>/avatar.png
```

Le script limite les fichiers à 2 Mo et aux types JPEG, PNG, WebP et GIF. La route de suppression du compte utilise la service role key pour retirer les fichiers avant de supprimer l'utilisateur Auth.

## Vérifications utiles

Lister les contraintes et relations :

```sql
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace
order by table_name::text, conname;
```

Lister les policies :

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

Lister les profils et leurs rôles :

```sql
select user_id, username, email, role, created_at
from public.profiles
order by created_at;
```
