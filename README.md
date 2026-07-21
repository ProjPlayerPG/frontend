# PlayerPG

PlayerPG est une encyclopédie RPG moderne construite avec Next.js, Supabase et un service jeux dédié. Ce dépôt contient l'interface : catalogue, fiches, authentification, favoris, administration, chatbot et intégration avec les API serveur.

## Stack

- Frontend : Next.js App Router, React, TypeScript, Tailwind CSS
- Authentification et données utilisateur : Supabase Auth, Postgres, Storage, RLS
- Données jeux et IA : service externe `game_service`
- E-mails : Supabase Auth par défaut pour le moment, Brevo prévu avec un domaine authentifié

## Lancer le projet

Pour une première installation, suivre le [guide d'installation locale](docs/installation.md). Il contient le schéma Supabase complet, les policies RLS, la configuration Auth et le parcours de vérification.

Depuis la racine globale `PlayerPG`, lancer le frontend :

```bash
cd frontend/frontend
npm install
npm run dev
```

Puis lancer le service jeux :

```bash
cd ../../game_service/game_service
npm install
npm run dev
```

Par défaut, le frontend tourne sur `http://localhost:3000`. Le service jeux doit être référencé par `NEXT_PUBLIC_GAME_SERVICE_URL` dans le `.env` du frontend.

## Scripts utiles

Frontend :

```bash
npm run dev
npm run lint
npm run build
npm run start
npm test
npm run test:watch
npm run test:coverage
npx supabase start
npx supabase db reset
npx supabase migration list
npx supabase db push --dry-run
```

Service jeux :

```bash
npm run dev
npm run start
```

## Documentation frontend

- [Installation locale et parcours jury](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Variables d'environnement](docs/env.md)
- [Supabase](docs/supabase.md)
- [Référence SQL Supabase consolidée](docs/supabase-setup.sql)
- [Fonctionnalités](docs/features.md)
- [Tests et couverture](docs/tests.md)
- [Déploiement Vercel, Render et CI/CD](docs/deployment.md)

## Documentation services

- [game_service](https://github.com/ProjPlayerPG/game_service/blob/main/README.md)

## Notes importantes

- Les clés secrètes ne doivent jamais être préfixées par `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` et `BREVO_API_KEY` doivent rester côté serveur.
- Brevo SMTP fonctionne mieux avec un domaine authentifié. Les adresses Gmail/Outlook/Yahoo peuvent être refusées ou considérées comme non conformes.
