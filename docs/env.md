# Variables d'environnement frontend

Cette page liste les variables du frontend Next.js. Les variables du service jeux sont documentees dans la [documentation game_service](../../../game_service/game_service/docs/env.md).

Ne jamais exposer une cle secrete avec le prefixe `NEXT_PUBLIC_`.

Fichier local: `frontend/frontend/.env`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GAME_SERVICE_URL=http://localhost:3001

SUPABASE_SERVICE_ROLE_KEY=

# A ajouter quand Brevo API sera cable
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=PlayerPG
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Details

`NEXT_PUBLIC_SUPABASE_URL`
: URL publique du projet Supabase.

`NEXT_PUBLIC_SUPABASE_ANON_KEY`
: cle anon publique Supabase, utilisable cote navigateur avec RLS.

`NEXT_PUBLIC_GAME_SERVICE_URL`
: URL du service Express qui expose IGDB, Mistral et les endpoints de recommandations.

`SUPABASE_SERVICE_ROLE_KEY`
: cle serveur uniquement. Utilisee par les routes API Next.js pour les actions admin et la suppression de compte.

`BREVO_API_KEY`
: cle serveur uniquement. Elle servira aux emails applicatifs, pas a Supabase Auth.

## Vercel

Sur Vercel, les variables frontend doivent etre ajoutees dans les settings du projet. Les variables secretes restent sans prefixe `NEXT_PUBLIC_`.

Brevo SMTP demandera idealement un domaine authentifie, par exemple `playerpg.fr`, avec SPF/DKIM/DMARC.
