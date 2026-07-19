# Installation locale

Ce guide permet de lancer une instance complète de PlayerPG sur une nouvelle configuration. Il est pensé pour la démonstration et l'évaluation du projet.

## Prérequis

- Node.js 20 ou une version LTS plus récente.
- Un projet Supabase.
- Une application Twitch Developer pour accéder à IGDB.
- Une clé API Mistral pour la traduction et le chatbot.
- Les dépôts `frontend` et `game_service` placés dans le même dossier parent.

Brevo n'est pas requis pour tester le projet localement. Supabase Auth peut utiliser son fournisseur d'e-mails par défaut.

## 1. Préparer Supabase

Docker Desktop doit être démarré. Depuis `frontend/frontend`, installer les dépendances puis reconstruire Supabase localement :

```bash
npm install
npx supabase start
npx supabase db reset
```

`db reset` recrée uniquement la base locale, applique dans l'ordre les fichiers de `supabase/migrations/`, puis charge `supabase/seed.sql`. Les migrations constituent la source de vérité versionnée du schéma.

Pour préparer un projet Supabase distant neuf :

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Ne jamais exécuter `supabase db reset --linked` sur une base contenant des données : cette variante détruit et reconstruit la base distante.

Le fichier [`supabase-setup.sql`](supabase-setup.sql) reste une référence SQL consolidée et lisible. Il ne remplace pas l'historique des migrations. Le détail de chaque table et des choix de sécurité se trouve dans [Supabase](supabase.md).

Dans les réglages **Data API**, conserver l'API activée et le schéma `public` exposé. Les migrations gèrent elles-mêmes les grants et RLS ; il n'est donc pas nécessaire d'accorder automatiquement des droits aux nouvelles tables.

## 2. Configurer Supabase Auth

Dans **Authentication > URL Configuration** :

- Site URL : `http://localhost:3000`
- Redirect URL : `http://localhost:3000/profile?reset-password=1`

Deux modes sont possibles pour les tests :

- conserver la confirmation d'e-mail, puis confirmer chaque compte avant la première connexion ;
- désactiver temporairement **Confirm email** dans le fournisseur Email pour un test local immédiat.

Ne pas activer un SMTP Brevo incomplet : Supabase refuserait alors l'inscription au moment d'envoyer l'e-mail de confirmation.

Le fournisseur **Email** doit rester activé. Le mot de passe est stocké et haché par Supabase Auth ; aucune colonne de mot de passe ne doit être ajoutée à `profiles`.

## 3. Configurer les variables d'environnement

Créer `frontend/frontend/.env` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_GAME_SERVICE_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Créer `game_service/game_service/.env` :

```env
PORT=3001
TWITCH_CLIENT_ID=<twitch-client-id>
TWITCH_CLIENT_SECRET=<twitch-client-secret>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
MISTRAL_API_KEY=<mistral-api-key>
MISTRAL_MODEL=mistral-small-latest
IGDB_CACHE_TTL_MS=600000
IGDB_CACHE_MAX_ENTRIES=200
```

La service role key et les secrets Twitch/Mistral ne doivent jamais être préfixés par `NEXT_PUBLIC_` ni être commités.

Les valeurs Supabase se trouvent dans **Project Settings > API Keys** ou dans le panneau **Connect** :

- l'URL du projet devient `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_URL` ;
- la publishable key, ou la clé legacy `anon`, devient `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- la clé legacy `service_role` devient `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement.

La version actuelle de `game_service` utilise la clé legacy `service_role`, qui est un JWT. Ne pas utiliser une nouvelle clé `sb_secret_...` à cet emplacement tant que les appels REST Supabase du service n'ont pas été adaptés.

## 4. Lancer les deux applications

Terminal 1 :

```bash
cd game_service/game_service
npm install
npm run dev
```

Terminal 2 :

```bash
cd frontend/frontend
npm install
npm run dev
```

Vérifier ensuite :

- `http://localhost:3001` répond `Game service OK` ;
- `http://localhost:3000` affiche PlayerPG.

## 5. Créer le premier administrateur

1. Créer un compte depuis `/profile`.
2. Confirmer l'adresse e-mail si la confirmation est active.
3. Se connecter une première fois pour créer la ligne `profiles`.
4. Dans le SQL Editor Supabase, exécuter :

```sql
update public.profiles
set role = 'admin'
where email = 'adresse-du-jury@example.com';
```

Contrôler le résultat :

```sql
select user_id, username, email, role
from public.profiles
order by created_at;
```

Il faut tester l'accès admin depuis `/profile` ou `/admin`. Un appel direct à `select public.is_admin();` dans le SQL Editor renvoie normalement `false`, car l'éditeur s'exécute sans la session Auth du navigateur.

## 6. Parcours de vérification

1. Parcourir, filtrer et paginer le catalogue.
2. Ouvrir une fiche et ajouter plusieurs jeux aux favoris.
3. Tester la traduction française d'un synopsis.
4. Demander une recommandation sur `/chatbot`.
5. Proposer un terme sur `/glossaire/proposer` avec au moins une source HTTPS.
6. Avec le compte admin, publier ou rejeter la proposition sur `/admin`.
7. Revenir sur le profil du contributeur pour vérifier la notification.
8. Tester l'avatar, la modification du profil et la réinitialisation du mot de passe.

## 7. Exécuter les tests

Dans chacun des deux dépôts, exécuter :

```bash
npm test
npm run test:coverage
```

Les détails du socle de tests, les modules couverts et les prochaines étapes sont regroupés dans [Tests et couverture](tests.md).

## Dépannage rapide

- `permission denied for table ...` : vérifier l'historique avec `npx supabase migration list`, puis contrôler les grants autant que les policies. Ne pas corriger directement la base distante hors migration.
- Erreur `401` : la session a expiré ou le token n'est pas transmis ; se reconnecter.
- Erreur `403` dans `/admin` : vérifier `profiles.role = 'admin'` pour le compte connecté.
- Erreur `409` sur les favoris : vérifier la contrainte unique `(user_id, igdb_game_id)` et que `id` utilise bien `gen_random_uuid()`.
- Traduction indisponible : vérifier `MISTRAL_API_KEY`, `SUPABASE_URL`, la service role key et la table `game_translations` dans le service jeux.
- Aucun jeu affiché : vérifier les identifiants Twitch/IGDB et que `game_service` écoute sur le port indiqué par `NEXT_PUBLIC_GAME_SERVICE_URL`.
