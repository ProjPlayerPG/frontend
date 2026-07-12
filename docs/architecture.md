# Architecture

PlayerPG est découpé en deux parties principales : le frontend Next.js et le service jeux Express. Cette page documente surtout le rôle du frontend.

## Vue globale

```text
Utilisateur
  |
  | navigateur
  v
Frontend Next.js
  |-- Supabase client : auth, session, favoris, profil
  |-- API routes serveur : admin, suppression compte
  |-- Server Components : pages jeux, catalogue, détail
  |
  +--> game_service Express
        |-- IGDB API : jeux, recherche, filtres, détail
        |-- Mistral API : traduction, recommandations
        |-- Supabase REST : cache IA, favoris pour le chatbot
```

## Frontend

Chemin : `frontend/frontend`

Le frontend utilise l'App Router de Next.js. Les pages principales sont :

- `/` : accueil, hero, nouvelles sorties, catalogue
- `/games` : catalogue avec filtres URL
- `/games/[id]` : fiche détaillée
- `/profile` : authentification, profil, avatar, favoris
- `/admin` : modération et gestion des rôles
- `/chatbot` : recommandations RPG par IA
- `/glossaire` : glossaire collaboratif
- `/personnages` : page statique actuelle, future page collaborative

Le rendu est mixte :

- SSR / Server Components pour les pages jeux et les données initiales.
- CSR pour les interactions : recherche, favoris, auth, chatbot, traduction.
- Streaming et skeletons pour charger certaines sections progressivement.
- Cache côté `game_service` pour limiter les appels IGDB.

## Relation avec game_service

Le frontend consomme le service jeux via `NEXT_PUBLIC_GAME_SERVICE_URL`. Le détail des endpoints, du cache IGDB, de Mistral et des filtres serveur est documenté dans la [documentation game_service](../../../game_service/game_service/README.md).

Règle importante : le frontend ne parle jamais directement à IGDB ni à Mistral.

## Supabase

Supabase gère :

- Authentification utilisateur.
- Table `profiles`.
- Table `favorites`.
- Storage `avatars`.
- Cache de traduction `game_translations`.
- Tables collaboratives du glossaire.
- Rôles `user` et `admin`.

Les opérations sensibles passent par des routes serveur Next.js ou par le `game_service` avec la service role key.

## E-mails

État actuel :

- Supabase Auth utilise l'envoi d'e-mail par défaut.
- Brevo SMTP a été testé mais dépend d'un expéditeur/domaine conforme.

Objectif :

- Garder Supabase Auth pour confirmation/reset.
- Utiliser Brevo API pour les notifications applicatives : proposition acceptée, rejetée, modération.
- Passer à Brevo SMTP quand un domaine PlayerPG est authentifié.
