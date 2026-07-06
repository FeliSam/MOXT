# MOXT React

Nouvelle application MOXT construite avec React et Vite, sans Next.js.

## Demarrage

```bash
npm install
npm run dev
```

Commandes de verification :

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run validate
```

## Lots termines

### Lot 1

- Vite et React ;
- Tailwind CSS ;
- React Router avec routes publiques, protegees et administrateur ;
- Redux Toolkit et RTK Query ;
- Context API pour le theme ;
- React Icons ;
- Formik et Yup, prets pour les formulaires du lot 2 ;
- composants UI reutilisables ;
- layout responsive ;
- Vitest et Testing Library.

### Lot 2

- connexion avec Formik et Yup ;
- inscription utilisateur ;
- recuperation de mot de passe simulee ;
- persistance de session sans mot de passe ;
- profil modifiable ;
- routes publiques et privees ;
- controle des roles dans l'interface ;
- tests des schemas, du service et du store d'authentification.

Le service actuel simule l'API afin de permettre le developpement du frontend.
L'authentification de production devra etre branchee a un backend avant toute mise
en ligne.

### Lot 3

- calculateur XOF/RUB ;
- marge de taux et frais centralises ;
- minimums et plafonds selon la verification ;
- creation de transfert avec Formik/Yup ;
- historique par utilisateur et recherche ;
- detail, chronologie, declaration de paiement et annulation ;
- stockage temporaire local en attente de l'API financiere ;
- tests des calculs et transitions de statut.

### Lot 4

- profils d'entreprise et annuaire professionnel ;
- statut de verification des comptes professionnels ;
- publication de voyages colis et reservation de capacite ;
- publication et acceptation d'offres P2P ;
- calcul des frais P2P avec minimum par devise ;
- suivi des transactions P2P ;
- tests des stores et transitions principales.

### Lot 5

- marketplace avec publication, recherche, favoris et statut vendu ;
- rattachement facultatif des annonces a une entreprise ;
- publication de jobs et candidatures separees ;
- publication d'evenements avec capacite et inscriptions ;
- pages de detail pour les trois domaines ;
- tests des favoris, candidatures et limites d'inscription.

### Lot 6

- messagerie avec controle des participants ;
- tickets support separes des conversations privees ;
- reponses utilisateur et agent ;
- notifications ciblees, compteur et lecture groupee ;
- pages Messages, Notifications et Support ;
- tests d'autorisation et d'isolation des donnees.

### Lot 7

- centre d'administration multi-domaines ;
- moderation des transferts, entreprises, annonces, jobs et evenements ;
- traitement des tickets par les agents ;
- journal d'audit automatique et persistant ;
- export de diagnostic avec jeton masque ;
- barriere globale contre les erreurs de rendu ;
- politique CSP et politique de referrer ;
- tests de moderation et d'audit.

### Lot 8

- design system semantique et mode clair/sombre global ;
- navigation SPA groupee, repliable, defilable et responsive ;
- prechargement des routes sans rechargement complet du document ;
- constantes, permissions et statuts centralises ;
- persistance locale sortie des reducers Redux ;
- fiches entreprise et espace professionnel ;
- contenus relies par `ownerId` et `businessId`, avec compatibilite historique ;
- messagerie contextuelle, non-lus et liens vers les objets concernes ;
- notifications automatiques entre les domaines ;
- recherche globale et page Mes activites ;
- tests Playwright de navigation SPA, routes directes et theme persistant.

L'ancien fichier HTML reste intact a la racine du dossier parent.

### Lots 9 a 16

- stabilisation des listes, statuts, formulaires, toasts et matrice fonctionnelle ;
- accueil public, découverte, confiance, FAQ et recherche globale ;
- favoris, documents, vérification, sécurité, préférences et export local ;
- tableau de bord professionnel, membres, documents, demandes, statistiques et avis ;
- réservations colis, P2P, preuves, litiges, reçus et paiements explicitement simulés ;
- édition, suppression, expiration et archivage des contenus communautaires ;
- messagerie avec réponses, réactions, recherche et archives restaurables ;
- Assistant MOXT local en lecture seule avec recherche Redux et liens contextuels ;
- administration des utilisateurs, rôles, suspensions et files de contrôle ;
- tests unitaires, intégration, build et parcours E2E SPA.

Les paiements et le portefeuille restent des simulations portant `simulation: true`.
Les documents locaux ne conservent que leurs métadonnées. Une API et des contrôles
serveur restent obligatoires avant une mise en production.

## Principes

- `Redux Toolkit` gere l'etat global partage.
- `RTK Query` gere les donnees venant du backend.
- `Context` reste reserve au theme et aux preferences globales simples.
- L'etat local React gere les interactions propres a un composant.
- Les regles metier vivent dans leur dossier `features`.
- Les pages assemblent les composants sans contenir la logique d'acces aux donnees.
- Aucun role ni droit sensible ne devra etre decide uniquement dans le navigateur.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le detail.

Voir [docs/FRONTEND_ROADMAP.md](docs/FRONTEND_ROADMAP.md) pour l'audit réel du front,
les fonctions encore partielles et l'ordre automatique des lots 17 à 29.
