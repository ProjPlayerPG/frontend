# Variables d'environnement frontend

Cette page liste les variables du frontend Next.js. Les variables du service jeux sont documentées dans la [documentation game_service](../../../game_service/game_service/docs/env.md).

Ne jamais exposer une clé secrète avec le préfixe `NEXT_PUBLIC_`.

Fichier local : `frontend/frontend/.env`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GAME_SERVICE_URL=http://localhost:3001

SUPABASE_SERVICE_ROLE_KEY=

# À ajouter quand Brevo API sera câblé
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=PlayerPG
```

Une configuration complète des deux applications est disponible dans le [guide d'installation](installation.md). Ne jamais versionner le fichier `.env` réel.

### Détails

`NEXT_PUBLIC_SUPABASE_URL`
: URL publique du projet Supabase.

`NEXT_PUBLIC_SUPABASE_ANON_KEY`
: publishable key, ou clé legacy `anon`, utilisable côté navigateur avec RLS.

`NEXT_PUBLIC_GAME_SERVICE_URL`
: URL du service Express qui expose IGDB, Mistral et les endpoints de recommandations.

`SUPABASE_SERVICE_ROLE_KEY`
: clé legacy `service_role` réservée au serveur. La version actuelle de `game_service` utilise cette clé JWT dans ses appels REST Supabase et n'est pas encore compatible avec les nouvelles clés `sb_secret_...`.

`BREVO_API_KEY`
: clé serveur uniquement. Elle servira aux e-mails applicatifs, pas à Supabase Auth.

## Vercel

Sur Vercel, les variables frontend doivent être ajoutées dans les settings du projet. Les variables secrètes restent sans préfixe `NEXT_PUBLIC_`.

Brevo SMTP demandera idéalement un domaine authentifié, par exemple `playerpg.fr`, avec SPF/DKIM/DMARC.
