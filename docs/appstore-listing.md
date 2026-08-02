# Fiche App Store (MOXT Capacitor iOS)

Bundle ID : `com.moxt.app`  
Version marketing : alignée sur `moxt-react/package.json` (actuellement **1.2.4**)  
Build iOS (`CFBundleVersion`) : **7** (Xcode → Target App)  
Projet : `moxt-react/ios` (Capacitor — **pas** `apps/mobile` Expo)

Privacy policy (obligatoire) :

```
https://moxtapp.ru/legal/privacy
```

Support / marketing : `https://moxtapp.ru`

Google Play (Android) : [`docs/google-play-listing.md`](./google-play-listing.md) · `npm run check:play-store`  
RuStore : [`docs/rustore-listing.md`](./rustore-listing.md)

---

## Appflow / Ionic Cloud (build iOS CI)

Le monorepo place Capacitor dans `moxt-react/`. Appflow cherche `capacitor.config.json` à la **racine** du Git — d’où l’erreur :

`native type is capacitor but capacitor.config.json is not available`

Fichiers déjà en place :

| Fichier | Rôle |
|---------|------|
| `capacitor.config.json` (racine) | Détection Appflow + `webDir: moxt-react/dist` |
| `ionic.config.json` (racine) | Marqueur projet Capacitor |
| `moxt-react/capacitor.config.json` | Config prod côté package |
| `appflow.config.json` | Monorepo : `root: moxt-react` + chemins iOS/Android |
| `ios` → `moxt-react/ios` | Symlink de secours si `appId` Appflow non renseigné |
| `android` → `moxt-react/android` | Idem |
| `npm run appflow:build` | Build web attendu par Appflow |

**Obligatoire** : remplacer `REPLACE_WITH_APPFLOW_APP_ID` dans [`appflow.config.json`](../appflow.config.json) par l’App ID du dashboard Ionic (Overview de l’app MOXT). Sans ça, le bloc monorepo est ignoré (mais les fichiers racine + symlinks couvrent le cas courant).

```bash
npm run check:ios-store
```

## Prêt côté repo (sans Mac)

Vérifier :

```bash
npm run check:ios-store
npm run web:cap:prod:sync
```

Inclus dans le repo :

| Élément | Chemin |
|---------|--------|
| Entitlements Debug (APNs development) | `moxt-react/ios/App/App/App.entitlements` |
| Entitlements Release (APNs production) | `moxt-react/ios/App/App/AppRelease.entitlements` |
| Privacy Manifest | `moxt-react/ios/App/App/PrivacyInfo.xcprivacy` |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` dans Info.plist |
| Exemple Firebase iOS | `GoogleService-Info.plist.example` |
| Export archive (Mac) | `moxt-react/ios/ExportOptions.plist.example` |

---

## Textes à coller dans App Store Connect

### Nom
MOXT

### Sous-titre (≤ 30 caractères)
```
Afrique ↔ Russie — services
```

### Promotional text (optionnel, ≤ 170)
```
Transferts, colis voyageurs, marketplace et emplois pour la diaspora Afrique–Russie. App autonome, messagerie et aide intégrées.
```

### Description FR

```
MOXT — l’application des services entre l’Afrique et la Russie.

Envoyez et suivez des transferts, publiez ou réservez des colis voyageurs, achetez et vendez sur la marketplace, trouvez un emploi ou une entreprise de confiance — pensé pour la diaspora afro-russe (Bénin, Afrique de l’Ouest ↔ Russie). Application iOS complète et autonome (contenu embarqué, navigation, messagerie, push, aide intégrée), pas un simple accès web ni une redirection vers un site.

FONCTIONNALITÉS
• Transferts et suivi entre communautés
• Colis voyageurs avec messagerie
• Marketplace (annonces, favoris, recherche)
• Emplois et entreprises
• Aide intégrée « Comment utiliser Moxt »
• Vérification d’identité et score de confiance
• Notifications push (messages, transferts, abonnements)
• Interface FR / RU / EN / PT / ES

SÉCURITÉ
• Compte protégé, vérification optionnelle (KYC)
• Pas de lecture SMS ni de géolocalisation GPS requise
• Politique de confidentialité : https://moxtapp.ru/legal/privacy

Téléchargez MOXT et rejoignez la communauté.
```

### Description EN

```
MOXT — the services platform connecting Africa and Russia.

Send and track transfers, publish or book traveler parcels, buy and sell on the marketplace, find jobs or trusted businesses — built for the Afro-Russian diaspora (Benin / West Africa ↔ Russia). A complete standalone iOS app (embedded UI, messaging, push, in-app help), not a website wrapper.

FEATURES
• Transfers and tracking across communities
• Traveler parcels with in-app messaging
• Marketplace (listings, favorites, search)
• Jobs and businesses
• In-app help « How to use Moxt »
• Identity verification and trust score
• Push notifications
• UI in FR / RU / EN / PT / ES

SECURITY
• Protected account, optional KYC
• No SMS reading and no required GPS
• Privacy: https://moxtapp.ru/legal/privacy
```

### Description RU

```
MOXT — приложение сервисов между Африкой и Россией.

Отправляйте и отслеживайте переводы, публикуйте или бронируйте посылки с попутчиками, покупайте и продавайте на маркетплейсе, ищите работу или проверенный бизнес — для афро-российской диаспоры. Полноценное автономное iOS-приложение, а не веб-обёртка.

ВОЗМОЖНОСТИ
• Переводы и отслеживание
• Посылки с перепиской
• Маркетплейс
• Вакансии и компании
• Встроенная справка
• Верификация и рейтинг доверия
• Push-уведомления
• Интерфейс FR / RU / EN / PT / ES

Политика конфиденциальности: https://moxtapp.ru/legal/privacy
```

### Mots-clés FR (≤ 100 caractères, virgules, sans espaces inutiles)
```
transfert,colis,marketplace,emploi,diaspora,Afrique,Russie,XOF,RUB,parrainage
```

### What’s New (1.2.4)
```
• Statuts plus rapides au chargement
• Notifications temps réel (plus besoin de recharger la liste)
• Correctifs stabilité et performance
```

---

## App Privacy (questionnaire Connect) — guide

Déclarer selon le comportement réel de l’app (à valider avec la privacy page) :

| Donnée | Collectée | Liée à l’identité | Usage typique |
|--------|-----------|-------------------|---------------|
| Coordonnées (e-mail / téléphone) | Oui | Oui | Compte / auth |
| Nom / profil | Oui | Oui | Compte |
| Contenu utilisateur (messages, annonces, preuves) | Oui | Oui | Fonctionnalité app |
| Identifiants (ID utilisateur) | Oui | Oui | Compte |
| Diagnostics (crash optionnel) | Selon Sentry / outils | Non si anonymisé | Analytics / perf |
| Localisation précise | Non (sauf si ajouté plus tard) | — | — |
| Tracking publicitaire | Non | — | — |

Pas de tracking ATT / IDFA prévu.

---

## Captures d’écran (à faire sur Mac / iPhone)

Exigences usuelles App Store :

| Device | Tailles courantes |
|--------|-------------------|
| iPhone 6.7" | 1290×2796 ou 1320×2868 |
| iPhone 6.1" | 1179×2556 |
| iPad (si ciblé) | 2048×2732 |

Scènes suggérées (comme RuStore) : dashboard, transferts, colis, marketplace, emplois, messagerie, aide Moxt, profil.

Sur Windows en attendant : préparer les textes et scènes ; les PNG finaux doivent venir d’un simulateur / appareil iOS.

Dépôt local suggéré : `outputs/appstore-screenshots/` (gitignoré si volumineux).

---

## Checklist Mac (le jour J)

1. Copier / générer `GoogleService-Info.plist` :
   ```bash
   npm run setup:firebase:ios
   ```
   (fichier gitignoré → `moxt-react/ios/App/App/GoogleService-Info.plist`)
2. Apple Developer → Identifiers → activer **Push Notifications** sur `com.moxt.app`
3. Créer clé **APNs** (.p8) → Firebase Console → Project settings → Cloud Messaging → Apple app configuration
4. `npm run web:cap:prod:sync` puis `npm run web:cap:prod:ios`
5. Xcode → Signing : Team + capability **Push Notifications**
6. Vérifier Release = `AppRelease.entitlements` (production)
7. Device réel : login, caméra QR, push
8. Product → Archive → Distribute → App Store Connect
9. Connect : build + fiche + Submit for Review

```bash
npm run check:ios-store
npm run web:cap:prod:sync
# Sur Mac seulement :
npm run web:cap:prod:ios
```

---

## Ce qui reste forcément hors repo

- Compte Apple Developer (99 $/an)
- Création de l’app dans App Store Connect
- Team ID / certificats / provisioning (Automatic Signing sur Mac)
- Archive IPA + upload
- Captures iPhone natives
- Review Apple
