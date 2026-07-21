# Déploiement

PlayerPG utilise trois services hébergés :

- Vercel pour le frontend Next.js et ses routes API.
- Render pour `game_service`, le serveur Express.
- Supabase pour PostgreSQL, Auth et Storage. La base distante Supabase est déjà hébergée : seules les migrations doivent lui être appliquées.

## 1. Vérifier Supabase

Depuis le dépôt frontend :

```bash
npx supabase migration list
```

Chaque version doit apparaître dans les colonnes `Local` et `Remote`. Sinon :

```bash
npx supabase db push --dry-run
npx supabase db push
```

Ne jamais utiliser `db reset --linked` sur la base de production.

## 2. Intégration continue

Chaque dépôt contient `.github/workflows/ci.yml` :

- `frontend` exécute les tests, ESLint et le build Next.js sur `master` et ses pull requests ;
- `game_service` exécute les tests sur `main` et ses pull requests.

GitHub Actions constitue la partie CI. Les intégrations Git de Render et Vercel constituent la partie CD : chaque modification de la branche de production déclenche un nouveau déploiement.

## 3. Déployer `game_service` sur Render

Créer un **Web Service** depuis `ProjPlayerPG/game_service` :

| Champ | Valeur |
| --- | --- |
| Name | `playerpg-game-service` |
| Region | région européenne la plus proche |
| Branch | `main` |
| Root Directory | laisser vide |
| Runtime | `Node` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Variables obligatoires :

```env
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<legacy-service-role-jwt>
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-small-latest
IGDB_CACHE_TTL_MS=600000
IGDB_CACHE_MAX_ENTRIES=200
```

Render fournit automatiquement `PORT`. Ne pas le définir manuellement. Pour le premier déploiement, `CORS_ORIGINS` peut rester absent. Après le déploiement Vercel, l'ajouter avec l'URL de production Vercel sans slash final.

Quand le workflow GitHub Actions est visible sur le dépôt, régler **Auto-Deploy** sur **After CI Checks Pass**.

Vérifier ensuite :

```text
https://<service>.onrender.com/health
https://<service>.onrender.com/api/games?limit=1
```

## 4. Déployer le frontend sur Vercel

Importer `ProjPlayerPG/frontend` :

| Champ | Valeur |
| --- | --- |
| Framework Preset | `Next.js` |
| Production Branch | `master` |
| Root Directory | `./` |
| Build Command | valeur Next.js par défaut |

Variables obligatoires pour les environnements Production et Preview :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-ou-legacy-anon-key>
NEXT_PUBLIC_GAME_SERVICE_URL=https://<service>.onrender.com
SUPABASE_SERVICE_ROLE_KEY=<legacy-service-role-jwt>
```

Ne jamais préfixer la service role key avec `NEXT_PUBLIC_`.

Chaque push sur `master` produit un déploiement de production. Les autres branches et les pull requests produisent des previews.

## 5. Finaliser Supabase Auth et CORS

Dans **Supabase > Authentication > URL Configuration** :

- `Site URL` : URL Vercel de production ;
- Redirect URLs :
  - `http://localhost:3000/**` ;
  - `https://<projet>.vercel.app/**` ;
  - éventuellement le motif de preview Vercel de l'équipe.

Dans Render, définir ensuite :

```env
CORS_ORIGINS=https://<projet>.vercel.app,http://localhost:3000
```

## 6. Vérifications finales

1. Ouvrir `/`, `/games` et une fiche jeu.
2. Tester la recherche et la pagination.
3. Créer un compte et confirmer l'e-mail.
4. Tester les favoris, l'avatar et les notifications.
5. Tester une traduction et une recommandation IA.
6. Proposer puis modérer une entrée du glossaire.
7. Contrôler les journaux Vercel et Render en cas d'erreur.
