# Architecture

PlayerPG est decoupe en deux parties principales: le frontend Next.js et le service jeux Express. Cette page documente surtout le role du frontend.

## Vue globale

```text
Utilisateur
  |
  | navigateur
  v
Frontend Next.js
  |-- Supabase client: auth, session, favoris, profil
  |-- API routes serveur: admin, suppression compte
  |-- Server Components: pages jeux, catalogue, detail
  |
  +--> game_service Express
        |-- IGDB API: jeux, recherche, filtres, detail
        |-- Mistral API: traduction, recommandations
        |-- Supabase REST: cache IA, favoris pour le chatbot
```

## Frontend

Chemin: `frontend/frontend`

Le frontend utilise le App Router de Next.js. Les pages principales sont:

- `/`: accueil, hero, nouvelles sorties, catalogue
- `/games`: catalogue avec filtres URL
- `/games/[id]`: fiche detaillee
- `/profile`: authentification, profil, avatar, favoris
- `/admin`: moderation et gestion des roles
- `/chatbot`: recommandations RPG par IA
- `/glossaire`: page statique actuelle, future page collaborative
- `/personnages`: page statique actuelle, future page collaborative

Le rendu est mixte:

- SSR / Server Components pour les pages jeux et les donnees initiales.
- CSR pour les interactions: recherche, favoris, auth, chatbot, traduction.
- Streaming et skeletons pour charger certaines sections progressivement.
- Cache cote `game_service` pour limiter les appels IGDB.

## Relation avec game_service

Le frontend consomme le service jeux via `NEXT_PUBLIC_GAME_SERVICE_URL`. Le detail des endpoints, du cache IGDB, de Mistral et des filtres serveur est documente dans la [documentation game_service](../../../game_service/game_service/README.md).

Regle importante: le frontend ne parle jamais directement a IGDB ni a Mistral.

## Supabase

Supabase gere:

- Authentification utilisateur.
- Table `profiles`.
- Table `favorites`.
- Storage `avatars`.
- Cache de traduction `game_translations`.
- Tables collaboratives du glossaire.
- Roles `user` et `admin`.

Les operations sensibles passent par des routes serveur Next.js ou par le `game_service` avec la service role key.

## Emails

Etat actuel:

- Supabase Auth utilise l'envoi email par defaut.
- Brevo SMTP a ete teste mais depend d'un expéditeur/domaine conforme.

Objectif:

- Garder Supabase Auth pour confirmation/reset.
- Utiliser Brevo API pour les notifications applicatives: proposition acceptee, rejetee, moderation.
- Passer a Brevo SMTP quand un domaine PlayerPG est authentifie.
