# PlayerPG

PlayerPG est une encyclopedie RPG moderne construite avec Next.js, Supabase et un service jeux dedie. Ce repo contient l'interface: catalogue, fiches, auth, favoris, admin, chatbot et integration avec les APIs serveur.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Auth et donnees utilisateur: Supabase Auth, Postgres, Storage, RLS
- Donnees jeux et IA: service externe `game_service`
- Emails: Supabase Auth par defaut pour le moment, Brevo prevu avec domaine authentifie

## Lancer le projet

Depuis la racine globale `PlayerPG`, lancer le frontend:

```bash
cd frontend/frontend
npm install
npm run dev
```

Puis lancer le service jeux:

```bash
cd ../../game_service/game_service
npm install
npm run dev
```

Par defaut, le frontend tourne sur `http://localhost:3000`. Le service jeux doit etre reference par `NEXT_PUBLIC_GAME_SERVICE_URL` dans le `.env` du frontend.

## Scripts utiles

Frontend:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Service jeux:

```bash
npm run dev
npm run start
```

## Documentation frontend

- [Architecture](docs/architecture.md)
- [Variables d'environnement](docs/env.md)
- [Supabase](docs/supabase.md)
- [Fonctionnalites](docs/features.md)

## Documentation services

- [game_service](../../game_service/game_service/README.md)

## Notes importantes

- Les cles secretes ne doivent jamais etre prefixees par `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` et `BREVO_API_KEY` doivent rester cote serveur.
- Brevo SMTP fonctionne mieux avec un domaine authentifie. Les adresses Gmail/Outlook/Yahoo peuvent etre refusees ou considerees non conformes.
