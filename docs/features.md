# Fonctionnalites

## Catalogue RPG

Le catalogue affiche les jeux RPG issus d'IGDB avec:

- Pagination.
- Filtre par tag.
- Filtre par plateforme.
- Filtre par annee.
- Tri cumulable: alphabetique, date de sortie.
- Etat des filtres dans l'URL.

Les extensions et DLC sont exclus du catalogue pour eviter de polluer la navigation. Ils restent accessibles depuis la fiche du jeu de base.

## Recherche

La recherche est placee dans le header.

Caracteristiques:

- Recherche client-side avec autocomplete.
- Redirection vers la fiche jeu.
- Nettoyage de la recherche apres navigation.
- Exclusion des extensions/DLC et contenus adultes.

## Fiche jeu

Chaque fiche affiche:

- Image de couverture ou artwork.
- Titre.
- Genres.
- Date de parution.
- Plateformes.
- Studio.
- Editeur.
- Synopsis.
- Storyline si disponible.
- Traduction Francais / Original.
- Bouton favori.
- Extensions et contenus lies si le jeu en possede.
- Lien retour vers le jeu de base si la fiche consultee est une extension.
- Section "Notes presse" preparee pour une future integration fiable.

## Traduction IA

La traduction utilise Mistral via le `game_service`. Le frontend affiche le toggle Original / Francais et appelle l'endpoint serveur.

Regles:

- Traduction uniquement du `summary` et de la `storyline`.
- Pas de traduction des titres, noms propres, genres, plateformes, studios ou editeurs.
- Traduction a la demande.
- Cache Supabase dans `game_translations`.
- Fallback propre si Mistral ou Supabase est indisponible.

## Chatbot RPG

Le chatbot est sur une page dediee: `/chatbot`.

Objectif:

- Recommander 3 a 5 RPG selon la demande utilisateur.
- Envoyer la demande au `game_service`.
- Eviter de recommander les jeux deja en favoris.
- Exclure les contenus adultes/erotiques.

## Decouverte aleatoire

Le bouton "Decouvrir un RPG" redirige vers une fiche RPG aleatoire.

Les contraintes de selection sont gerees cote `game_service`.

## Authentification

Supabase Auth gere:

- Inscription.
- Connexion.
- Deconnexion.
- Mot de passe oublie.
- Modification du compte.
- Suppression du compte.

Supabase gere aussi le hash du mot de passe.

## Profil

La page profil permet:

- Voir le pseudo.
- Voir l'avatar.
- Modifier l'avatar.
- Modifier les informations du compte.
- Supprimer le compte.
- Voir les favoris.
- Retirer un favori.
- Acceder a l'admin si le role est `admin`.

## Favoris

Les utilisateurs connectes peuvent ajouter ou retirer un jeu de leurs favoris.

La table `favorites` est protegee par RLS et une contrainte unique evite les doublons par utilisateur.

## Admin

La page `/admin` permet:

- Voir les propositions de glossaire en attente.
- Publier ou rejeter une proposition.
- Voir les utilisateurs.
- Promouvoir un utilisateur en admin.
- Retrograder un admin en utilisateur.

Protection:

- Verification de session Supabase.
- Verification du role `admin`.
- Actions sensibles via route serveur.

## Glossaire

Etat actuel:

- Page statique avec cartes cliquables prevues.
- Tables Supabase pretes pour un futur glossaire collaboratif.
- Moderation deja presente cote admin.

Objectif:

- Liste des termes.
- Detail type article/blog.
- Jeux liés.
- Formulaire de contribution.
- Sources HTTPS obligatoires.
- Contribution publiee directement si admin, sinon `pending`.

Etat implemente:

- La page `/glossaire` lit les entrées publiees depuis Supabase.
- Les cartes menent vers `/glossaire/[slug]`.
- Le formulaire est isole dans `/glossaire/proposer`.
- Le formulaire cree une proposition via route serveur.
- Les sources non HTTPS et les liens locaux/prives sont refuses.
- L'admin voit les sources dans la moderation.
- Les pages detaillees affichent le contributeur et ses autres publications.
- Une notification profil est creee quand l'admin publie ou refuse une proposition.

## Personnages

Etat actuel:

- Page statique.

Objectif:

- Reprendre la logique collaborative du glossaire.
- Fiches personnages/archetypes.
- Moderation admin.
- Contributions utilisateur.

## Brevo

Etat actuel:

- Brevo SMTP teste.
- Les adresses freemail comme Gmail sont considerees non conformes pour l'envoi fiable.
- Supabase Auth reste sur l'envoi email par defaut.

Objectif:

- Utiliser Brevo API pour les notifications applicatives.
- Migrer SMTP vers Brevo quand un domaine PlayerPG est authentifie.

## Details backend

Les comportements propres aux donnees IGDB, au cache, a Mistral et aux recommandations sont documentes dans la [documentation game_service](../../../game_service/game_service/README.md).
