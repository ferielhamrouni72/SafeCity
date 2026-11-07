# SafeCity — version fusionnée (connexion citoyen + inscription citoyen)

## Lancer le projet
1. `cp .env.example .env` puis `docker compose up -d`
2. `cd web && cp .env.example .env.local && npm install && npm run dev`
3. Mobile : `adb reverse tcp:3000 tcp:3000`, puis ouvrir `mobile/` dans Android Studio.

## Ce qui a été corrigé
### Web
- Marqueurs de conflit Git (`<<<<<<<`) supprimés dans : package.json, register/route.ts, journal.ts,
  connexion/page.tsx, tableau-de-bord (page, hook, css), .gitignore, docker-compose.yml.
- `/api/auth/register` = création d'un AGENT par l'ADMIN uniquement (requireAuth).
- `/api/auth/register-citoyen` = inscription publique, crée TOUJOURS un CITOYEN.
- `journal.ts` : toutes les actions conservées (REINITIALISATION_MDP manquait → erreur TypeScript).
- Sécurité reprise de la version Feriel : mot de passe limité à 72 octets (`password.ts`),
  lien de réinitialisation construit depuis APP_URL (jamais depuis l'en-tête Host),
  jeton refusé si le compte est suspendu, pas de lien dans les logs en production.
- `.env.example` ajoutés (web + docker).

### Mobile
- Un seul package : `com.iset.safecity` (le projet de Feriel utilisait `com.example.safecity`).
- `MainActivity` redirige vers Home/Login ; `RegisterActivity` n'est plus l'écran de démarrage.
- Login → « Créer un compte » ouvre l'inscription ; après inscription on revient au login (e-mail pré-rempli).
- Écran d'inscription refait dans le même style que le login (ViewBinding + ViewModel).
- Logs réseau en BASIC (BODY affichait mot de passe et jeton).
- HTTP en clair autorisé seulement en debug (`src/debug/AndroidManifest.xml`).
- `allowBackup=false` (le jeton ne part plus dans les sauvegardes cloud).
- Plugins Kotlin 2.0.21 inutilisés retirés de Gradle (conflit avec le Kotlin intégré à AGP 9).
- Fichiers parasites supprimés : hs_err_pid*.log, replay_pid*.log, .kotlin/, .idea/, package-lock.json à la racine.
