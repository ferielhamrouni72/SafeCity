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

---

# Sprint 3 — Envoi d'une photo par un citoyen

## Base de données
- Nouvelle table `photo` : `db/init/04-photo.sql`.
  Si votre base existe déjà, exécutez ce fichier à la main (phpMyAdmin > base `safecity` > onglet SQL),
  les scripts de `db/init` ne tournent qu'à la toute première création du volume Docker.

## Web (API)
- `POST /api/photos` (citoyen connecté, multipart, champ `photo`) :
  JPEG / PNG / WebP uniquement (vérifié sur le contenu réel, pas sur l'extension), 5 Mo max,
  10 photos par heure et par citoyen, nom de fichier généré par le serveur (UUID), action `ENVOI_PHOTO` journalisée.
- `GET /api/photos/{id}` : l'auteur de la photo, ou un agent / administrateur (404 pour les autres citoyens).
- Les fichiers sont stockés dans `web/uploads/photos` (ou `UPLOAD_DIR`), jamais dans `public/`, jamais sur GitHub.

## Mobile
- Nouvel écran `PhotoActivity` (bouton « Envoyer une photo » sur l'accueil) :
  appareil photo ou galerie, aperçu, envoi.
- La photo est réduite (1600 px max, JPEG), son orientation corrigée, avant l'envoi.
- Jeton expiré (2 h) : retour automatique à la connexion.

## Fichiers nouveaux
db/init/04-photo.sql, web/src/lib/photos.ts, web/src/app/api/photos/route.ts, web/src/app/api/photos/[id]/route.ts,
mobile/.../data/{PhotoApi,PhotoModels,PhotoRepository}.kt, mobile/.../ui/photo/{PhotoActivity,PhotoViewModel,ImageCompressor}.kt,
res/layout/activity_photo.xml, res/xml/file_paths.xml, res/drawable/{bg_photo_preview,ic_camera,ic_image}.xml

## Fichiers modifiés (petites modifications)
web/src/lib/journal.ts, web/.gitignore, web/.env.example, mobile/.../data/ApiClient.kt,
AndroidManifest.xml (activité + FileProvider), HomeActivity.kt, activity_home.xml

## Fusion avec le travail de Feriel (branche `feriel`)
- Écran mobile « Mot de passe oublié » : `ForgotPasswordActivity.kt`, `activity_forgot_password.xml`, `PasswordApi.kt`.
- Son client réseau séparé (`PasswordClient`) est remplacé par `ApiClient.passwordApi` (une seule configuration réseau).
- L'e-mail saisi sur l'écran de connexion est pré-rempli dans l'écran « Mot de passe oublié ».
- `ForgotPasswordActivity` : `exported="false"` dans le manifest.
