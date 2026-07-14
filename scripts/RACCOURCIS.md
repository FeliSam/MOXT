# MOXT — Raccourcis npm

Commandes pour aller vite au quotidien. Toutes s’exécutent à la racine du dépôt.

## Une seule commande (recommandé)

| Commande | Action |
|----------|--------|
| `npm run tout -- -m "message"` | **Tout en une fois** : commit + push + migrations + Supabase (parallèle) + site Yandex + purge CDN |
| `npm run ship -- -m "message"` | Identique à `tout` |
| `npm run go -- -m "message"` | Identique (message via `MOXT_COMMIT_MSG` possible) |
| `npm run cpd -- -m "message"` | Identique (commit · push · deploy) |

**Exemple :**
```bash
npm run tout -- -m "fix inscription SMS"
```

Sans `-m` si rien à committer (push + deploy seulement) :
```bash
npm run tout -- --no-commit
```

### Détail du pipeline `tout` / `ship`

1. **Git commit** — si fichiers modifiés et `-m "message"` fourni  
2. **Git push** — `origin HEAD`  
3. **Migrations** — `npm run db:push`  
4. **Supabase en parallèle** — `setup:smsc`, `setup:admin-promote`, `setup:push` (+ natif si FCM configuré)  
5. **Site Yandex** — build prod + upload + purge CDN  

---

## Déploiement

| Commande | Description |
|----------|-------------|
| `npm run deploy:all` | Migrations + Supabase parallèle + Yandex (sans git) |
| `npm run deploy:all -- --purge-cdn` | + invalidation cache CDN |
| `npm run web:deploy:yandex` | Site uniquement (build + upload) |
| `npm run db:push` | Migrations Supabase uniquement |

---

## Supabase / infra

| Commande | Description |
|----------|-------------|
| `npm run setup:smsc` | SMSC OTP + edge functions SMS |
| `npm run setup:admin-promote` | Verrouillage promotion admin |
| `npm run setup:push` | Web Push VAPID + `send-push` |
| `npm run setup:push:native` | FCM Android/iOS + secrets serveur |
| `npm run setup:production` | Config prod Supabase (legacy Netlify) |

---

## Vérifications

| Commande | Description |
|----------|-------------|
| `npm run fix` | Tests + `check:site` + `check:smsc` **en parallèle** |
| `npm run check:push` | État push web + Capacitor Android/iOS |
| `npm run check:site` | Smoke test moxtapp.ru |
| `npm run check:smsc` | Solde et mode test SMSC |
| `npm run verify:deploy` | Version déployée vs git |

---

## Capacitor (apps natives)

| Commande | Description |
|----------|-------------|
| `npm run web:cap:prod:sync` | Build prod **sans localhost** + sync APK/IPA |
| `npm run web:cap:prod:android` | Sync + ouvre Android Studio |
| `npm run web:cap:dev:sync` | Dev live reload (IP LAN) |
| `npm run web:cap:doctor` | Diagnostic Capacitor |

---

## Développement

| Commande | Description |
|----------|-------------|
| `npm run web` | Dev Vite local |
| `npm run web:build` | Build production |
| `npm run test` | Tests shared + web |
| `npm run moxt -- help` | Aide CLI complète |

---

## Variables utiles

| Variable | Effet |
|----------|--------|
| `MOXT_COMMIT_MSG="..."` | Message de commit pour `go` / `ship` |
| `MOXT_DEPLOY_PUSH=1` | Force git push dans `deploy:all` |
| `MOXT_SKIP_DB_PUSH=1` | Saute migrations dans `setup:smsc` |
| `MOXT_SKIP_DEPLOY=1` | Saute Yandex dans `deploy:all` |

---

## Push notifications — état et config

| Canal | État | Action |
|-------|------|--------|
| **Web** (moxtapp.ru) | VAPID + service worker | `npm run setup:push` |
| **Android** | FCM via `google-services.json` | `npm run firebase:login` → `npm run setup:firebase -- --project=ID` → `npm run setup:push:native` |
| **iOS** | APNs via Firebase ou Xcode | Capability Push + `GoogleService-Info.plist` + `npm run setup:push:native` |
| **Serveur** | `send-push` web + FCM natif | `scripts/firebase-service-account.json` → `npm run setup:push:native` |

### Firebase CLI (assistant guidé)

Une seule commande guide tout le branchement FCM Android :

```bash
npm run setup:firebase
# alias : npm run firebase:connect
```

L’assistant :
1. Ouvre la connexion Google si besoin  
2. Liste vos projets → vous choisissez le numéro  
3. Crée/relie l’app `com.moxt.app` + télécharge `google-services.json` (timeout + retries sur `sdkconfig`)  
4. Compte de service : en mode interactif, attend le JSON ; en `--yes`, ouvre la console et **quitte sans bloquer**  
5. Si le SA est présent → propose `setup:push:native` (secrets Supabase + redeploy `send-push`)

Puis build natif :

```bash
npm run web:cap:prod:sync
npm run check:push
```

Sans interaction (projet déjà connu) :

```bash
npm run setup:firebase -- --project=blog-post-3bcea --yes
```

Si `google-services.json` est prêt mais le serveur FCM manque encore :

1. Console → Paramètres projet → Comptes de service → **Générer une nouvelle clé privée**  
2. Enregistrer comme `scripts/firebase-service-account.json`  
3. `npm run setup:push:native` puis `npm run check:push`

Voir `npm run check:push` pour le diagnostic à jour.
