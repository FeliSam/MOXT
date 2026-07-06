# Architecture MOXT

## Consolidation des lots 9 a 16

- `features/account` centralise favoris, métadonnées de documents, vérification et préférences.
- `features/finance`, `features/disputes` et `features/reviews` isolent les nouveaux domaines.
- `features/administration` conserve le registre local des rôles et suspensions de démonstration.
- Les annonces, emplois et événements possèdent un cycle de vie et des signalements persistés.
- `assistantProvider.js` définit une interface remplaçable. Le fournisseur local lit l’index Redux
  et ne contacte aucun service externe.
- L’administration traite les vérifications, litiges, avis et signalements via leurs slices.
- `useContentLifecycle` simule l’expiration au montage de l’application.

Les permissions du navigateur servent à l’expérience utilisateur, pas à la sécurité. Le futur
backend devra vérifier chaque rôle, propriétaire, transition de statut et relation métier.

## Arborescence

```text
src/
|-- app/                 # Store, providers et routeur
|-- components/
|   |-- layout/          # Structure des pages
|   |-- routing/         # Gardes de routes
|   `-- ui/              # Design system reutilisable
|-- contexts/            # Theme et preferences simples
|-- features/            # Domaines metier et slices Redux
|-- pages/               # Assemblage des ecrans
|-- services/            # Client API et services transversaux
`-- test/                # Configuration des tests
```

## Etat applicatif

| Besoin                                 | Outil            |
| -------------------------------------- | ---------------- |
| Session, permissions, filtres partages | Redux Toolkit    |
| Donnees du backend et cache            | RTK Query        |
| Theme et langue                        | Context API      |
| Ouverture d'un panneau local           | Etat React local |
| Formulaires                            | Formik et Yup    |

Une donnee ne doit pas etre stockee simultanement dans Redux et Context.

## Routage

- `/login`, `/register` et `/forgot-password` sont publics.
- Un utilisateur connecte est redirige hors des pages publiques.
- Les pages sous `AppLayout` demandent une session.
- `/profile` permet de modifier les informations personnelles.
- `/admin` demande le role `admin` ou `superadmin`.
- Le backend devra refaire chaque controle de permission.
- `AppLayout` reste monte pendant les changements de route : seuls les enfants de
  `<Outlet />` changent.
- Les liens internes utilisent React Router. Les routes sont chargees a la demande
  et prechargees au survol de la navigation.
- Le serveur renvoie `index.html` pour les routes inconnues afin qu'un acces direct
  reste compatible avec `BrowserRouter`.

## Authentification

Le module `features/auth` contient :

- `authSlice.js` pour la session Redux et les operations asynchrones ;
- `authSchemas.js` pour les schemas Formik/Yup ;
- `authService.js` comme adaptateur temporaire vers la future API ;
- `sessionStorage.js` pour conserver uniquement le profil et un jeton de session.

Le mot de passe n'est jamais place dans Redux ou dans `localStorage`. Les comptes
de demonstration sont des donnees de developpement et doivent disparaitre lorsque
le backend d'authentification sera disponible.

## Transferts

Le module `features/transfers` separe :

- la configuration des devises, taux de secours, frais et limites ;
- les fonctions pures de calcul et de validation ;
- le slice Redux et les transitions de statut ;
- le stockage local temporaire ;
- les schemas de formulaire ;
- les composants de calcul et de statut.

Les valeurs calculees dans le navigateur servent uniquement a la demonstration.
L'API de production devra recalculer le taux, les frais, les limites et le montant
recu avant de creer une operation financiere.

## Entreprises, colis et P2P

Les trois domaines du lot 4 disposent de slices distincts. Une entreprise est
attachee a son proprietaire et reste en `pending_review` avant validation. Un
voyage colis expose une capacite restante qui diminue avec les reservations. Une
offre P2P devient indisponible des son acceptation et cree une transaction
separee.

Le stockage local est mutualise par `services/createLocalStorage.js`. Il reste un
adaptateur de developpement : disponibilites, reservations, statuts, plafonds et
frais devront etre verifies dans des transactions atomiques cote serveur.

## Marketplace, jobs et evenements

Les contenus publies sont separes de leurs interactions :

- les favoris referencent une annonce et un utilisateur ;
- les candidatures referencent un job et un candidat ;
- les inscriptions referencent un evenement et un participant.

Cette modelisation evite les tableaux imbriques difficiles a synchroniser. Le
backend devra imposer l'unicite des favoris, candidatures et inscriptions, ainsi
que les capacites et permissions de publication.

## Communications

Les conversations privees, tickets support et notifications utilisent des
collections distinctes. Un message de conversation est refuse si son auteur ne
fait pas partie des participants. Les agents administratifs interviennent dans
les tickets support, jamais directement dans une conversation privee.

Une conversation metier possede `relatedType`, `relatedId`, `relatedPath`,
`participantIds` et `unreadBy`. Elle est ouverte depuis une fiche et une
conversation sans destinataire reel est refusee.

## Administration et audit

Le centre d'administration assemble les files de moderation sans contourner les
reducers des domaines. `auditMiddleware` observe les actions metier et cree des
entrees contenant l'action, l'acteur, son role, la cible et la date.

Le journal local aide au developpement mais ne constitue pas une preuve
inalterable. En production, les permissions, logs, exports et decisions de
moderation doivent etre produits et conserves par le backend.

L'application possede egalement une barriere globale de rendu et une politique
CSP. Les exports de diagnostic masquent le jeton de session.

## Domaines prevus

Chaque domaine aura la structure suivante :

```text
features/transfers/
|-- api/
|-- components/
|-- hooks/
|-- schemas/
|-- transferSlice.js
`-- utils/
```

Les domaines principaux sont `auth`, `users`, `transfers`, `businesses`, `parcels`,
`p2p`, `marketplace`, `jobs`, `events`, `conversations`, `notifications` et
`administration`.

## API

`services/baseApi.js` fournit le client RTK Query commun. Chaque domaine injectera
ses propres endpoints avec `baseApi.injectEndpoints`.

Le navigateur ne doit jamais :

- attribuer un role depuis une adresse email ;
- conserver un mot de passe ;
- valider seul une operation financiere ;
- etre la source de verite des permissions.

## Design system

Les composants communs se trouvent dans `components/ui`. Toute nouvelle variante
doit representer un besoin partage, pas seulement le style particulier d'une page.

Les couleurs de marque sont configurees avec Tailwind dans `src/index.css`.
Les couleurs semantiques reposent sur des variables CSS afin que les composants
communs utilisent les memes surfaces, textes et bordures dans les deux themes.

## Persistance et interactions

Les reducers restent purs. `persistenceMiddleware` sauvegarde les domaines apres
leurs actions en conservant les anciennes cles locales. `interactionMiddleware`
orchestre les notifications et confirmations entre les domaines.

Les options partagees vivent dans `src/config`. Les relations professionnelles
utilisent `businessId`; les donnees historiques sans cet identifiant sont encore
rattachees par `ownerId`.

## Validation

`npm run validate` execute le formatage, ESLint, les tests Vitest, le build de
production et les tests Playwright. Le scenario E2E verifie explicitement que le
document n'est pas recharge pendant une navigation React Router.

## Migration

Le fichier historique reste disponible pendant la migration. Un domaine est retire
de l'ancien fichier seulement lorsque son equivalent React est implemente, teste et
branche a l'API.
