# Tests et couverture

PlayerPG utilise Vitest pour les tests unitaires du frontend Next.js et de `game_service`. Les rapports de couverture utilisent le moteur V8 et imposent un seuil minimal de 80 % sur les modules inclus.

## Commandes

Les mêmes commandes sont disponibles dans les deux dépôts :

```bash
npm test
npm run test:watch
npm run test:coverage
```

- `npm test` exécute la suite une fois et convient à la CI.
- `npm run test:watch` relance les tests pendant le développement.
- `npm run test:coverage` produit un résumé dans le terminal et un rapport HTML dans `coverage/`.

Les dossiers de rapports sont ignorés par Git.

## Couverture actuelle

### Frontend

Les tests couvrent actuellement :

- la normalisation des URL du service jeux et des images IGDB ;
- le remplacement des tailles de couvertures IGDB ;
- la validation et la conversion des paramètres du catalogue ;
- les pages invalides, les filtres inconnus et les paramètres multiples.

### game_service

Les tests couvrent actuellement :

- l'exclusion des DLC, extensions et autres catégories non principales ;
- la détection des classifications et termes adultes ;
- la normalisation des filtres et des tris IGDB ;
- le calcul des bornes annuelles et l'échappement des recherches ;
- l'extraction des termes de recommandation ;
- la déduplication et le classement des candidats ;
- la validation des recommandations retournées par Mistral ;
- la détection d'un cache de traduction absent, partiel ou identique au texte original.

Les appels réels à IGDB, Mistral et Supabase ne sont pas exécutés par ces tests unitaires.

### Base Supabase locale

Après `npx supabase start` et `npx supabase db reset`, le contrôle d'intégration SQL vérifie les permissions de `profiles`, les policies RLS, les contraintes validées et la configuration du bucket `avatars` :

```bash
npx supabase db query --local --file supabase/tests/security.sql
```

Ce test échoue notamment si le rôle `authenticated` récupère un droit d'écriture sur `profiles.role`. Il ne contacte pas la base distante et ne laisse aucune donnée de test.

## Organisation

Les fichiers de test sont placés à côté du module testé avec le suffixe `.test.ts` ou `.test.js`. Les fonctions métier pures sont isolées des composants et des appels réseau afin de rester rapides et déterministes.

Les composants serveur asynchrones Next.js seront vérifiés plus tard avec des tests de parcours dans un navigateur. Les prochaines suites unitaires et d'intégration accompagneront la recherche paginée, les notifications et les évolutions du glossaire.
