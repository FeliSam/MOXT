# Fiche RuStore (MOXT) — descriptions, confidentialité, captures

Package Android : `com.moxt.app`  
Console : [https://console.rustore.ru](https://console.rustore.ru)

Ce fichier est prêt à coller dans la console. Les **captures d’écran** doivent être prises sur l’app reale (émulateur / appareil) — elles ne sont pas générées ici.

---

## URL de confidentialité (obligatoire)

Utiliser **exactement** :

```
https://moxtapp.ru/legal/privacy
```

Alias (redirige vers la même page) : `https://moxtapp.ru/privacy`

> Déployer le front (`npm run cpd` / `ship`) après merge pour que la version longue de la politique soit en production.

---

## Descriptions à coller

### Court FR (≤ ~80 caractères recommandés)

```
Transferts, colis, marketplace et emplois — diaspora Afrique ↔ Russie
```

### Long FR

```
MOXT — la plateforme des services entre l’Afrique et la Russie.

Envoyez et suivez des transferts, publiez ou réservez des colis voyageurs, achetez et vendez sur la marketplace, trouvez un emploi ou une entreprise de confiance — pensé pour la diaspora afro-russe (Bénin, Afrique de l’Ouest ↔ Russie).

FONCTIONNALITÉS
• Transferts et suivi entre communautés
• Colis voyageurs avec messagerie
• Marketplace (annonces, favoris, recherche)
• Emplois et entreprises
• Vérification d’identité et score de confiance
• Notifications push (messages, transferts, abonnements)
• Interface FR / RU / EN / PT

SÉCURITÉ
• Compte protégé, vérification optionnelle (KYC)
• Pas de lecture SMS ni de géolocalisation GPS requise
• Politique de confidentialité : https://moxtapp.ru/legal/privacy

Téléchargez MOXT et rejoignez la communauté.
```

### Court RU

```
Переводы, посылки, маркетплейс и работа — диаспора Африка ↔ Россия
```

### Long RU

```
MOXT — платформа сервисов между Африкой и Россией.

Отправляйте и отслеживайте переводы, публикуйте или бронируйте посылки с попутчиками, покупайте и продавайте на маркетплейсе, ищите работу или проверенный бизнес — для афро-российской диаспоры (Бенин, Западная Африка ↔ Россия).

ВОЗМОЖНОСТИ
• Переводы и отслеживание между сообществами
• Посылки с попутчиками и переписка
• Маркетплейс (объявления, избранное, поиск)
• Вакансии и компании
• Верификация личности и рейтинг доверия
• Push-уведомления (сообщения, переводы, подписки)
• Интерфейс FR / RU / EN / PT

БЕЗОПАСНОСТЬ
• Защищённый аккаунт, опциональная верификация (KYC)
• Без чтения SMS и без обязательной GPS-геолокации
• Политика конфиденциальности: https://moxtapp.ru/legal/privacy

Скачайте MOXT и присоединяйтесь к сообществу.
```

Copies sources versionnées aussi dans :
- `apps/mobile/store-metadata/fr-FR/`
- `apps/mobile/store-metadata/ru-RU/`

---

## Icône store

| Asset | Chemin | Usage |
|-------|--------|--------|
| **Recommandé 512×512** | `moxt-react/public/mx-512.png` | Icône application RuStore (512×512, PNG) |
| Maskable | `moxt-react/public/mx-512-maskable.png` | Variante safe-zone |
| Marque X | `moxt-react/public/assets/logos/X.png` | Logo marketing si besoin |

RuStore : icône carrée **512×512**, PNG/JPG, généralement ≤ 1–3 Mo selon le champ console.

---

## Captures d’écran — checklist RuStore

Exigences usuelles (vérifier la console au moment du dépôt) :

| Critère | Valeur |
|---------|--------|
| Obligatoire | Au moins **1 jeu téléphone** (1–10 images) |
| Formats | PNG ou JPG |
| Ratio | **9:16** (portrait) ou **16:9** (paysage) — cohérent dans le lot |
| Max résolution | ≈ **2160×3840** (mobile) |
| Poids | ≤ **3 Mo** / image téléphone |
| Contenu | UI réelle de l’app ; texte RU ou EN privilégié pour RuStore ; pas de clickbait |

### Scènes suggérées (ordre recommandé)

1. Accueil / tableau de bord (identité de marque)
2. Transferts ou solde
3. Colis / voyageurs
4. Marketplace (grille d’annonces)
5. Emplois ou détail annonce
6. Messagerie
7. Profil / vérification (confiance)

### Comment capturer

**Émulateur Android Studio**

1. `npm run web:cap:prod:sync` puis `npm run web:cap:open:android`
2. Lancer l’app sur un AVD téléphone (ex. Pixel, API récente)
3. Mettre l’UI en **russe** (Langue) pour la fiche RuStore
4. Émulateur → icône appareil photo / `Ctrl+S` → sauver les PNG
5. Recadrer en 9:16 si besoin (éviter barres de statut sales)

**Appareil réel**

1. Installer le build debug/release signé
2. Captures système Android, puis exporter vers le PC
3. Vérifier que rien de perso (noms, IBAN, photos) n’apparaît

**Option web (aperçu seulement)** — `npm run test:e2e` dans `moxt-react` produit des screenshots Playwright dans `test-results/` ; utiles pour QA, **pas** un substitut aux captures natives RuStore.

Dépôt local suggéré (gitignoré si volumineux) : `outputs/rustore-screenshots/`

---

## Signature AAB (même certificat pour les updates)

```bash
# 1) Générer keystore + key.properties (gitignorés) — une seule fois
npm run android:keystore

# 2) Sync web prod → Capacitor
npm run web:cap:prod:sync

# 3) Bundle signé
cd moxt-react/android
.\gradlew.bat bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```

Sans keytool : Android Studio → **Build → Generate Signed Bundle / APK**.

Sauvegarder le `.jks` + `key.properties` hors du repo. RuStore exige le **même** certificat pour les mises à jour.

Auth API RuStore (clés seulement, pas d’upload fiche) : `npm run check:rustore` — voir `scripts/RACCOURCIS.md`.

---

## Étapes manuelles restantes dans la console

1. Créer / ouvrir l’app `com.moxt.app`
2. Coller descriptions (FR et/ou RU)
3. Coller l’URL confidentialité `https://moxtapp.ru/legal/privacy`
4. Uploader l’icône 512 + captures
5. Uploader l’AAB signé (première version + certificat)
6. Remplir catégorie, contacts, âge / contenu si demandé
7. Soumettre à modération
