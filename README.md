# MOXT Monorepo

Structure partagée entre le **web** (Vite) et le **mobile** (Expo iOS + Android).

```
Moxt/
├── package.json              # workspaces npm
├── moxt-react/               # App web (Vite + React)
├── apps/
│   └── mobile/               # App Expo (@moxt/mobile)
└── packages/
    └── shared/               # Logique partagée (@moxt/shared)
```

## Commandes

Depuis la racine `Moxt/` :

```bash
npm install

# Web
npm run web
npm run web:build
npm run web:test

# Mobile Expo
npm run mobile
npm run mobile:android
npm run mobile:ios

# Tests
npm run shared:test
npm test
```

---

## Roadmap mobile

### Phase 0 — Validée

- Monorepo npm workspaces + Metro
- Expo Router, 4 onglets (Accueil, Transferts, Marketplace, Colis)
- Redux minimal + i18n FR/EN via `@moxt/shared`
- Config partagée : routes, navigation, formatters, storage

### Phase 1 — Validée (auth)

- Factory Supabase + stockage session (`expo-secure-store` / localStorage web)
- `createAuthService` + `createAuthSlice` dans `@moxt/shared`
- Login mobile + guard navigation + bootstrap session au démarrage
- Web branché sur les modules auth/shared

### Phase 2 — Validée (données + listes + détails)

- `remoteRowMapper`, `createLoadCoreData`, `createItemsSlice` dans `@moxt/shared`
- Sync Supabase mobile : transferts + colis (`loadCoreData`)
- Écrans liste **Transferts** et **Colis** (pull-to-refresh, recherche)
- Écrans **détail** transfert (progression, timeline, montants) et colis (trajet, capacité)
- **Création MVP transfert** (direction, montant, destinataire → insert Supabase)
- **Inscription mobile** + **logout** sur l'accueil (dashboard stats)

### Phase 3 — Validée (marketplace + auth complète + upload)

- **Marketplace mobile** : liste filtrable en grille 2 colonnes + détail annonce (prix, vendeur, contact WhatsApp/tel)
- **Inscription complète** avec vérification OTP (e-mail / SMS) + écran code 6 chiffres
- **Google OAuth** (bouton « Continuer avec Google » sur login et register)
- **Upload preuves de paiement** via `expo-image-picker` (galerie + caméra → Supabase Storage)
- Stores Redux typés : `marketplace`, `transfers`, `parcels`, `auth` avec `RootState`

### Phase 4 — Validée (notifications + messagerie + profil + wizard + admin)

- **Notifications push** via `expo-notifications` — config Android/iOS + écran liste (lu/non-lu)
- **Messagerie in-app** — liste conversations + chat temps réel (bulles, envoi, scroll)
- **Profil utilisateur éditable** — prénom, nom, ville, tél, avatar (image picker)
- **Wizard transfert multi-étapes** — direction → montant (calcul frais) → destinataire → confirmation
- **Admin mobile** — stats globales + modération annonces (réservé rôle admin/superadmin)
- Dashboard accueil enrichi (actions rapides, badge notifs, lien messages/profil/admin)

### Phase 5 — Mobile : Marketplace complet, Jobs, Reçus, Badges ✅

- **Publication annonce mobile** — wizard multi-étapes (type → infos → photos → confirmation) avec insert Supabase
- **Réservation colis mobile** — formulaire poids + description, insert `parcel_requests`, lien depuis détail colis
- **Offres d'emploi mobile** — liste recherchable + écran détail + candidature en un clic
- **Reçu transfert partageable** — écran récapitulatif formaté + partage natif (Share API)
- **Système de badges / gamification** — 8 badges définis, Redux slice `badges`, écran visuel earned/locked
- Dashboard enrichi avec accès rapide (Publier, Emplois, Badges)

### Phase 6 — Temps réel, Avis, Dark mode, Offline, Admin stats ✅

- **Supabase Realtime** — écoute live des changements (transferts, colis, messages, annonces) → notifications instantanées
- **Système d'avis / notations** — écran dédié, étoiles 1-5, commentaires, note moyenne, Redux slice `ratings`
- **Dark mode** — système de thème complet (couleurs light/dark), `AppThemeProvider`, hook `useThemeColors()`
- **Mode hors-ligne** — cache local AsyncStorage, file d'attente d'actions offline, sync automatique au retour réseau
- **Admin stats avancé** — tableau de bord graphique (transferts, volumes, utilisateurs, barres mensuelles)
- Dashboard enrichi avec bouton "Avis"

### Phase 7 — Dark mode appliqué, i18n RU, Tests, CI/CD ✅

- **Dark mode appliqué** — couleurs dynamiques sur écran d'accueil et marketplace via `useThemeColors()`
- **Internationalisation FR/EN/RU** — support complet du russe dans `uiTranslations.js`, phrases + remplacements mot-à-mot
- **Écran Paramètres** — sélection de langue (3 drapeaux), info thème, version app
- **Tests unitaires Jest** — 11 tests couvrant badges, notifications, ratings (+ mocks supabase)
- **CI/CD GitHub Actions** — workflow lint/typecheck + tests shared + tests mobile + EAS Build on main
- **EAS Build config** — profils development, preview, production

### Phase 8 — Deep linking, Favoris, Recherche, Onboarding, KYC, Haptics, Monitoring ✅

- **Deep linking & notifications navigables** — tap sur notif → navigation vers l'écran concerné (transfert, message, annonce, job)
- **Système de favoris** — Redux slice `favorites`, écran dédié, ajout/suppression depuis listings/parcels/jobs
- **Recherche globale unifiée** — écran de recherche cross-entity (transferts, colis, annonces)
- **Onboarding** — walkthrough 4 slides au premier lancement (AsyncStorage flag)
- **KYC simplifié** — upload recto/verso pièce d'identité + statut (pending/verified/rejected)
- **Dark mode sur tous les écrans** — `useThemeColors()` intégré sur accueil, marketplace, transfers, parcels, favoris, recherche, paramètres, onboarding, KYC
- **Haptics** — module utilitaire expo-haptics (light/medium/success/error/selection)
- **Monitoring** — module de tracking prêt pour Sentry (init, trackEvent, reportError, setUser)
- Dashboard enrichi (boutons recherche + favoris en header)

---

## Package @moxt/shared

| Module | Contenu |
|--------|---------|
| `config/` | routes, statuses, navigation |
| `i18n/` | translate, uiTranslations |
| `utils/` | formatters, phone, remoteRowMapper, transfers |
| `storage/` | createStorage |
| `auth/` | createAuthService, createAuthSlice |
| `supabase/` | createSupabaseClient, createBrowserSessionStorage |
| `data/` | createLoadCoreData |
| `slices/` | createItemsSlice |

Le web réexporte ces modules — une seule source de vérité.

---

## Prérequis mobile

- Node 20+
- [Expo Go](https://expo.dev/go) sur téléphone **ou** émulateur Android / simulateur iOS (Mac pour iOS natif)
- Fichier `apps/mobile/.env` (voir `.env.example`) avec clés Supabase

### Dépannage Expo

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Unable to resolve "../../App" from AppEntry.js` | Expo démarre depuis la racine monorepo | Toujours `npm run mobile` depuis `Moxt/` (pas `expo start` à la racine) |
| `Cannot find module 'expo-router/_ctx-shared'` | expo-router non visible depuis `@expo/cli` (racine) | `npm install` à la racine (postinstall crée le lien) |
| Tunnel ngrok fermé | Connexion instable | `npm run mobile:lan` ou relancer `mobile:tunnel:fresh` |
| Expo Go incompatible | SDK 57 récent | Mettre à jour Expo Go sur le téléphone |

Le script `apps/mobile/scripts/start-expo.cjs` force `EXPO_NO_METRO_WORKSPACE_ROOT=1` pour éviter la mauvaise racine projet.
