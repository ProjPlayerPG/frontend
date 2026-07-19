# Fonctionnalités

## Catalogue RPG

Le catalogue affiche les jeux RPG issus d'IGDB avec :

- Page dédiée `/games`.
- Pagination de 12 jeux par page.
- Filtre par tag.
- Filtre par plateforme.
- Filtre par année.
- Tri cumulable : alphabétique, date de sortie.
- État des filtres dans l'URL.

Les extensions et DLC sont exclus du catalogue pour éviter de polluer la navigation. Ils restent accessibles depuis la fiche du jeu de base.

## Recherche

La recherche est disponible dans le header et sur la page `/games`.

Caractéristiques :

- Autocomplétion à partir de 2 caractères.
- Validation avec la touche Entrée ou le bouton de recherche.
- Redirection vers `/games?q=...` et affichage des résultats paginés.
- Redirection directe vers la fiche d'un jeu depuis l'autocomplétion.
- Conservation de la recherche et de la page courante dans l'URL.
- Exclusion des extensions/DLC et contenus adultes.

## Accueil

L'accueil présente une synthèse des principaux contenus de PlayerPG sans dupliquer le catalogue :

- Nouvelles sorties RPG.
- Quatre dernières entrées publiées dans le glossaire.
- Accès directs au catalogue, au glossaire, aux personnages et au guide PlayerPG.
- Découverte aléatoire d'un RPG.

## Fiche jeu

Chaque fiche affiche :

- Image de couverture ou artwork.
- Titre.
- Genres.
- Date de parution.
- Plateformes.
- Studio.
- Éditeur.
- Synopsis.
- Storyline si disponible.
- Traduction Français / Original.
- Bouton favori.
- Extensions et contenus liés si le jeu en possède.
- Lien retour vers le jeu de base si la fiche consultée est une extension.
- Section "Notes presse" préparée pour une future intégration fiable.

## Traduction IA

La traduction utilise Mistral via le `game_service`. Le frontend affiche le toggle Original / Français et appelle l'endpoint serveur.

Règles :

- Traduction uniquement du `summary` et de la `storyline`.
- Pas de traduction des titres, noms propres, genres, plateformes, studios ou éditeurs.
- Traduction à la demande.
- Cache Supabase dans `game_translations`.
- Fallback propre si Mistral ou Supabase est indisponible.

## Chatbot RPG

Le chatbot est sur une page dédiée : `/chatbot`.

Objectif :

- Recommander 3 à 5 RPG selon la demande utilisateur.
- Envoyer la demande au `game_service`.
- Éviter de recommander les jeux déjà en favoris.
- Exclure les contenus adultes.

## Découverte aléatoire

Le bouton "Découvrir un RPG" redirige vers une fiche RPG aléatoire.

Les contraintes de sélection sont gérées côté `game_service`.

## Authentification

Supabase Auth gère :

- Inscription.
- Connexion.
- Déconnexion.
- Mot de passe oublié.
- Modification du compte.
- Suppression du compte.

Supabase gère aussi le hash du mot de passe.

## Profil

La page profil permet de :

- Voir le pseudo.
- Voir l'avatar.
- Modifier l'avatar.
- Modifier les informations du compte.
- Supprimer le compte.
- Voir les favoris.
- Retirer un favori.
- Accéder au centre de notifications.
- Accéder à l'admin si le rôle est `admin`.

## Notifications

Les utilisateurs connectés disposent de :

- Une cloche dans le header avec le nombre de notifications non lues.
- Un aperçu des cinq dernières notifications.
- Une page dédiée `/notifications`.
- Des actions pour marquer une notification ou toutes les notifications comme lues.
- Des actions pour supprimer une notification ou toutes les notifications.

Les notifications concernent actuellement la publication ou le refus d'une proposition de glossaire. Les règles RLS garantissent qu'un utilisateur peut uniquement consulter, acquitter et supprimer ses propres notifications.

## Favoris

Les utilisateurs connectés peuvent ajouter ou retirer un jeu de leurs favoris.

La table `favorites` est protégée par RLS et une contrainte unique évite les doublons par utilisateur.

## Admin

La page `/admin` permet de :

- Voir les propositions de glossaire en attente.
- Publier ou rejeter une proposition.
- Voir les utilisateurs.
- Promouvoir un utilisateur en admin.
- Rétrograder un admin en utilisateur.

Protection :

- Vérification de session Supabase.
- Vérification du rôle `admin`.
- Actions sensibles via route serveur.

## Glossaire

État implémenté :

- La page `/glossaire` lit les entrées publiées depuis Supabase.
- Les cartes mènent vers `/glossaire/[slug]`.
- Le formulaire est isolé dans `/glossaire/proposer`.
- Le formulaire crée une proposition via route serveur.
- Les sources non HTTPS et les liens locaux/privés sont refusés.
- L'admin voit les sources dans la modération.
- Les pages détaillées affichent le contributeur et ses autres publications.
- Une notification profil est créée quand l'admin publie ou refuse une proposition.

Les contributions d'un utilisateur standard sont placées en `pending`. Celles d'un admin sont publiées immédiatement. Le détail des tables et policies est disponible dans la [documentation Supabase](supabase.md).

## Personnages

État actuel :

- Page statique.

Objectif :

- Reprendre la logique collaborative du glossaire.
- Fiches personnages/archétypes.
- Modération admin.
- Contributions utilisateur.

## Brevo

État actuel :

- Brevo SMTP testé.
- Les adresses freemail comme Gmail sont considérées comme non conformes pour l'envoi fiable.
- Supabase Auth reste sur l'envoi d'e-mail par défaut.

Objectif :

- Utiliser Brevo API pour les notifications applicatives.
- Migrer SMTP vers Brevo quand un domaine PlayerPG est authentifié.

## Détails backend

Les comportements propres aux données IGDB, au cache, à Mistral et aux recommandations sont documentés dans la [documentation game_service](../../../game_service/game_service/README.md).
