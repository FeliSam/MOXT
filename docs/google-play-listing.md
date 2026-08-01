# Fiche Google Play (MOXT Capacitor Android)

Package : `com.moxt.app`  
versionName : **1.2.4** (aligné `moxt-react/package.json`)  
versionCode : **7** (incrémenter à chaque upload Play)  
targetSdk : **36**  
Console : [Google Play Console](https://play.google.com/console)

Privacy policy (obligatoire) :

```
https://moxtapp.ru/legal/privacy
```

Support : `https://moxtapp.ru` · `support@moxtapp.ru`

RuStore (même package Android) : [`docs/rustore-listing.md`](./rustore-listing.md)  
App Store iOS : [`docs/appstore-listing.md`](./appstore-listing.md)

---

## Prêt côté repo (sans compte Play)

```bash
npm run check:play-store
npm run web:cap:prod:sync
# Keystore (une fois, sauvegarder hors git) :
npm run android:keystore
# AAB signé :
npm run android:aab
# → moxt-react/android/app/build/outputs/bundle/release/app-release.aab
```

Inclus / aligné dans le repo :

| Élément | État |
|---------|------|
| Bundle ID | `com.moxt.app` |
| versionName / versionCode | 1.2.4 / 7 |
| targetSdk 36 | OK |
| Pas de `server.url` prod | Vérifié par `cap:prod:sync` + checklist |
| Cleartext HTTP release | `usesCleartextTraffic=false` |
| AD_ID | retiré (`tools:node="remove"`) — pas de pubs |
| Pas de SMS / GPS | OK |
| Signature release | `key.properties` + `keystore/` (gitignorés) |
| FCM | `google-services.json` (gitignoré) + `.example` |
| Textes coller | `moxt-react/store-metadata/android/` |

---

## Textes Play Console

### Titre de l’application (≤ 30)
```
MOXT
```

### Description courte (≤ 80 caractères)
```
Transferts, colis, marketplace et emplois — diaspora Afrique ↔ Russie
```

### Description complète FR

Voir `moxt-react/store-metadata/android/full-description-fr.txt` (copie ci-dessous) :

```
MOXT — l’application des services entre l’Afrique et la Russie.

Envoyez et suivez des transferts, publiez ou réservez des colis voyageurs, achetez et vendez sur la marketplace, trouvez un emploi ou une entreprise de confiance — pensé pour la diaspora afro-russe (Bénin, Afrique de l’Ouest ↔ Russie). Application Android complète et autonome (contenu embarqué, navigation, messagerie, push, aide intégrée), pas un simple accès web ni une redirection vers un site.

FONCTIONNALITÉS
• Transferts et suivi entre communautés
• Colis voyageurs avec messagerie
• Marketplace (annonces, favoris, recherche)
• Emplois et entreprises
• Aide intégrée « Comment utiliser Moxt » (sessions pas à pas)
• Vérification d’identité et score de confiance
• Notifications push (messages, transferts, abonnements)
• Interface FR / RU / EN / PT / ES

SÉCURITÉ
• Compte protégé, vérification optionnelle (KYC)
• Pas de lecture SMS ni de géolocalisation GPS requise
• Politique de confidentialité : https://moxtapp.ru/legal/privacy

Téléchargez MOXT et rejoignez la communauté.
```

### Description EN / RU

Fichiers : `full-description-en.txt`, `full-description-ru.txt` dans le même dossier.

### Nouveautés (1.2.4 / versionCode 7)
```
• Statuts plus rapides au chargement
• Notifications temps réel (plus besoin de recharger la liste)
• Correctifs stabilité et performance
• Préparation publication Google Play
```

---

## Assets graphiques

| Asset | Taille | Source suggérée |
|-------|--------|-----------------|
| Icône haute rés. | 512×512 | `moxt-react/public/mx-512.png` |
| Feature graphic | **1024×500** | À créer (marque MOXT + fond) — pas encore dans le repo |
| Captures téléphone | 16:9 ou 9:16 | Émulateur / appareil après `web:cap:prod:android` |
| Captures tablette (opt.) | 7" / 10" | Optionnel si vous ciblez tablettes |

Scènes suggérées : dashboard, transferts, colis, marketplace, emplois, messagerie, aide Moxt, profil.

Dépôt local : `outputs/play-screenshots/` (gitignoré si volumineux).

---

## Data safety (questionnaire Play) — guide

Déclarer selon le comportement réel + page privacy :

| Donnée | Collectée | Partagée | Usage |
|--------|-----------|----------|-------|
| Adresse e-mail / téléphone | Oui | Non (sauf prestataires auth/SMS) | Compte |
| Nom / photo de profil | Oui | Non (sauf affichage in-app aux pairs) | Compte / social |
| Messages / contenus utilisateur | Oui | Non hors app | Fonctionnalité |
| Identifiants utilisateur | Oui | Non | Compte |
| Fichiers images (preuves, annonces) | Oui | Non | Fonctionnalité |
| Approx. location | Non | — | — |
| Précise location | Non | — | — |
| ID publicitaire | **Non** | — | AD_ID retiré |
| Données de paiement carte dans l’app | Selon flux réel | — | Si hors app / manuel, le préciser |

- Encryption in transit : **Oui** (HTTPS)
- Users can request deletion : **Oui** (via support / compte — aligner avec privacy)
- Independant security review : Non (sauf si audit externe)

---

## Contenu app / déclarations Play

À cocher honnêtement dans la console :

- **Catégorie** suggérée : Finance ou Lifestyle (selon positionnement)
- **Public** : 18+ si contenus financiers / KYC ; sinon questionnaire PEGI / IARC
- **Permissions photos / caméra** : QR + pièces jointes / publications — déjà justifiées en strings
- **Services financiers** : l’app facilite des transferts entre utilisateurs — Play peut demander des précisions (pas une banque intégrée si c’est du matching communautaire ; formuler clairement)
- **Pas de WebView-only** : assets embarqués (`npm run web:cap:prod:sync`)
- **Play App Signing** : activer à la première soumission (recommandé)

---

## Checklist publication

1. Compte Google Play Console (frais unique développeur)
2. Créer l’app `com.moxt.app` (ou importer si déjà créée)
3. Coller fiches + privacy URL + Data safety
4. Uploader icône 512 + feature graphic 1024×500 + captures
5. `npm run check:play-store` puis `npm run android:aab`
6. Play Console → Production (ou test interne / fermé d’abord) → upload AAB
7. Remplir questionnaire contenu / audience / news
8. Envoyer en revue

Test interne recommandé avant Production.

---

## Alignement versions (convention MOXT)

| Plateforme | Champ | Valeur actuelle |
|------------|-------|-----------------|
| npm / package | version | 1.2.4 |
| Android | versionName | 1.2.4 |
| Android | versionCode | 7 |
| iOS | MARKETING_VERSION | 1.2.4 |
| iOS | CURRENT_PROJECT_VERSION | 7 |

À chaque release store : incrémenter **versionCode** et **CURRENT_PROJECT_VERSION** ensemble ; bumper versionName / MARKETING_VERSION si release utilisateur.

---

## Ce qui reste hors repo

- Compte Play Console + paiement développeur
- Feature graphic 1024×500
- Captures d’écran natives
- Upload AAB + revue Google
- Déclarations légales Data safety / finance (validation humaine)
