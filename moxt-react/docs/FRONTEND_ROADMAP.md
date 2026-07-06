# Audit front-end MOXT et feuille de route

## Portée

Ce document couvre uniquement les améliorations réalisables sans backend. Les paiements,
les fichiers, la sécurité, les rôles et les échanges entre comptes restent des simulations
locales tant qu’un serveur ne les confirme pas.

## État général

Le projet dispose déjà d’un socle React SPA solide: routage, Redux Toolkit, thème, composants
communs, formulaires, données de démonstration, persistance locale et tests. La couverture
fonctionnelle n’est toutefois pas terminée. Les principales limites sont:

- plusieurs pages de 15 à 23 Ko mélangent affichage, formulaires et règles métier;
- `baseApi` est configuré mais ne contient encore aucun endpoint;
- les données Redux ne sont pas normalisées et les relations sont souvent recalculées dans les pages;
- la matrice fonctionnelle historique déclarait à tort tous les domaines complets;
- les tests E2E couvrent le socle, mais pas chaque rôle, transition ou taille d’écran;
- les documents et preuves ne conservent que leurs métadonnées;
- certaines fonctions se recouvrent, notamment paiements, portefeuille, reçus et transferts;
- les contrôles de permissions sont adaptés à une démonstration, pas à une sécurité réelle.

## Lot 17 - Vérité fonctionnelle et stabilité

Statut: terminé le 15 juin 2026.

- matrice complète, partielle ou planifiée avec justification;
- alias historiques centralisés et routes canoniques documentées;
- conventions communes pour dates, montants, tailles et erreurs génériques;
- page de diagnostic local avec sauvegarde et remise à zéro sélective;
- schéma local et migrations versionnés et testés;
- erreurs de persistance rendues observables par l’application.

Validation: format, lint, tests de configuration, migrations, build et parcours de fumée.

## Lot 18 - Design system, responsive et accessibilité

Statut: terminé le 15 juin 2026.

- grille catalogue commune: 2 colonnes mobile, 3 tablette, 4 grand écran;
- champs et listes avec relations accessibles vers leurs erreurs;
- navigation clavier complète dans les onglets;
- boucle de focus dans les modales et restauration du focus;
- focus visible, réduction des animations et thème sombre conservés;
- composants communs réutilisés sur accueil, colis, marketplace, jobs, événements et entreprises.

Validation: lint, tests UI, axe, captures clair/sombre, responsive et E2E clavier.

## Lot 19 - Architecture et maintenabilité

Statut: terminé le 15 juin 2026.

- dépôt local générique remplaçable ultérieurement par une API;
- composants partagés de grille et chronologie;
- formats et messages transversaux centralisés;
- stockage des transferts aligné sur l’adaptateur commun;
- tests unitaires des nouvelles interfaces et composants.

Validation: tests des sélecteurs et hooks, seuil de taille par page, lint et build.

## Lot 20 - Compte, profil et sécurité simulée

Statut: terminé le 15 juin 2026.

- ajouter onboarding, avatar, coordonnées secondaires et complétion du profil;
- enrichir les sessions et appareils simulés, historique de connexion et déconnexion globale;
- créer de vrais parcours UI pour mot de passe, double authentification et codes de secours simulés;
- ajouter consentements, confidentialité par champ et effets réels des préférences;
- enrichir documents avec aperçu, expiration, remplacement et motif de refus;
- compléter export, suppression locale contrôlée et restauration avant délai;
- préparer l’internationalisation français/russe sans traductions codées dans les pages.

Validation: tests formulaires, confidentialité, export/import, mobile et E2E compte.

## Lot 21 - Transferts et reçus

Statut: terminé le 15 juin 2026.

- enregistrer un brouillon de transfert et permettre de reprendre chaque étape;
- gérer devis expirables, actualisation du taux, mode hors ligne et source du taux;
- appliquer réellement les plafonds glissants sur 30 jours;
- ajouter aperçu et remplacement des preuves avant déclaration;
- afficher les coordonnées de paiement et consignes propres à l’entreprise;
- renforcer les transitions uniques, permissions, délais, erreurs et reprise;
- unifier transfert, paiement simulé, portefeuille et reçu dans une seule chronologie;
- enrichir reçu PDF/image/partage et réclamation avec pièces jointes;
- ajouter contact bidirectionnel et contexte complet dans la conversation.

Validation: table de transitions, limites, preuves, reçus, permissions et E2E utilisateur/entreprise.

## Lot 22 - Entreprises et espace professionnel

Statut: terminé le 15 juin 2026.

- ajouter édition complète, logo, couverture, galerie, horaires, zones et FAQ;
- faire respecter une seule entreprise par propriétaire dans tous les parcours locaux;
- enrichir la validation admin avec checklist et motif de refus;
- gérer les modules activés, coordonnées de paiement, taux, frais et délais;
- compléter rôles internes, invitations simulées et permissions par onglet;
- ajouter demandes assignables, notes internes et historique;
- construire statistiques filtrables, exports et indicateurs de conversion;
- permettre réponses aux avis et signalement d’un avis.

Validation: droits propriétaire/membre, modération, modules, statistiques et E2E professionnel.

## Lot 23 - Marketplace

Statut: terminé le 15 juin 2026.

- compléter brouillons multiples, prévisualisation et duplication d’annonce;
- gérer variantes, stock, quantité, promotion, livraison et zone de remise;
- ajouter gestion des offres côté vendeur: accepter, refuser, contre-proposer;
- permettre au vendeur de répondre aux questions;
- ajouter comparaison, récemment consultés, annonces similaires et profil vendeur;
- enrichir galerie avec zoom, ordre, légendes et image principale;
- compléter archivage, republication, suppression et historique;
- renforcer signalements et modération avec raisons et preuves.

Validation: formulaires, stock, offres, propriétaire, responsive détail et E2E achat simulé.

## Lot 24 - Colis et P2P

Statut: terminé le 15 juin 2026.

- ajouter détail complet des demandes, acceptation, refus, annulation et historique;
- empêcher tout dépassement de capacité et restaurer les kilos après annulation;
- ajouter restrictions de contenu, dimensions, assurance simulée et points de remise;
- créer suivi des étapes du colis, preuve de remise et évaluation;
- renforcer P2P avec rôles acheteur/vendeur, délais, actions uniques et expiration;
- afficher preuves, confirmations, évaluations et litige dans une chronologie commune;
- ajouter favoris, profils de paiement et alertes de disponibilité.

Validation: concurrence simulée, capacités, transitions, permissions, litiges et deux E2E complets.

## Lot 25 - Jobs, événements et communauté

Statut: terminé le 15 juin 2026.

- ajouter brouillons, édition, fermeture et republication des jobs et événements;
- gérer CV, lettre, documents, retrait de candidature et historique candidat;
- ajouter pipeline recruteur, notes, entretien simulé et export des candidatures;
- créer billets, QR local, liste d’attente, contrôle de présence et certificat simulé;
- ajouter calendrier, rappel, partage, favoris et annulation d’inscription;
- enrichir les pages de détail et les profils organisateur/recruteur;
- harmoniser signalements, expiration et archivage.

Validation: capacités, unicité, permissions, documents et E2E candidat/recruteur/participant.

## Lot 26 - Messagerie, Assistant MOXT et notifications

Socle validé le 15 juin 2026: brouillons, épinglage, sourdine, archivage des notifications
et sources locales de l’assistant. Les améliorations avancées ci-dessous restent planifiées.

- ajouter brouillons de message, épinglage, mise en sourdine et classement;
- enrichir pièces jointes avec aperçu, taille, type et suppression avant envoi;
- ajouter recherche dans une conversation, navigation par résultat et filtres;
- compléter accusés de lecture, séparateurs, réponses, réactions et actions groupées;
- améliorer les listes longues avec pagination locale ou virtualisation;
- donner à l’assistant le contexte de la page, du rôle et de l’objet consulté;
- ajouter intentions structurées, formulaires guidés, confirmation et annulation d’action;
- afficher les sources locales utilisées par l’assistant;
- enrichir notifications avec catégories, regroupement, préférence et archivage;
- compléter support avec catégorie, urgence, SLA simulé, pièces jointes et satisfaction.

Validation: anti-duplication, participants, recherche, pièces jointes, assistant et E2E conversation.

## Lot 27 - Administration

Socle validé le 15 juin 2026: matrice centrale des rôles, contrôle automatisé des permissions
et export local de l’audit. Les améliorations avancées ci-dessous restent planifiées.

- créer un tableau de bord transversal avec filtres temporels;
- unifier les files de modération et ajouter actions groupées;
- exiger motif, note interne et historique pour chaque décision;
- enrichir utilisateurs avec activité, sanctions, vérifications et contenus liés;
- créer une matrice lisible des rôles et permissions;
- ajouter vue de prévisualisation par rôle sans modifier le compte;
- enrichir audit avec recherche, filtres, détails avant/après et export;
- ajouter statistiques et exports par domaine.

Validation: matrice des droits, audit, modération, exports et E2E admin/superadmin.

## Lot 28 - Découverte, internationalisation et expérience globale

Socle validé le 15 juin 2026: historique de recherche local, manifeste PWA, cache statique
et page hors ligne. La traduction complète et les améliorations avancées restent planifiées.

- enrichir accueil public, catégories, recommandations et contenus populaires;
- compléter recherche globale avec tri, historique, suggestions et filtres combinés;
- rendre les pages publiques partageables avec métadonnées cohérentes;
- traduire réellement l’interface en français et russe;
- ajouter formats régionaux pour nombres, dates, devises et téléphones;
- ajouter installation PWA, page hors ligne et cache des ressources statiques;
- prévoir favoris et brouillons disponibles hors ligne;
- ajouter centre d’aide contextuel, raccourcis clavier et visite guidée.

Validation: langues, formats, PWA, hors ligne, SEO statique et E2E découverte.

## Lot 29 - Qualité de livraison

Socle validé le 15 juin 2026: budgets automatisés, artefacts PWA contrôlés, documentation
de validation et checklist backend. Les audits visuels et de performance continus restent planifiés.

- atteindre une couverture minimale définie pour reducers, sélecteurs, hooks et composants critiques;
- ajouter E2E pour chaque rôle et parcours métier principal;
- ajouter tests d’accessibilité et régression visuelle;
- fixer des budgets de poids, temps de chargement et nombre de rendus;
- tester migrations, données corrompues, stockage plein et absence de réseau;
- ajouter journal d’erreurs front, écran de récupération et export de diagnostic;
- documenter architecture, données, permissions, scénarios et limites sans backend;
- produire une checklist de branchement backend par domaine.

Validation finale:

```text
format -> lint -> tests unitaires -> tests d’intégration -> build
-> accessibilité -> régression visuelle -> E2E desktop/mobile -> audit performance
```

## Règle d’exécution automatique

Les lots suivent l’ordre 17 à 29. Un lot ne passe au suivant que si sa validation complète
réussit. En cas d’échec, la correction reste dans le lot courant et toute régression est
ajoutée à la suite de tests avant de continuer.

## Hors périmètre sans backend

- authentification et récupération de compte réellement sécurisées;
- autorisation fiable des rôles et propriétaires;
- messagerie réellement transmise entre appareils;
- stockage et analyse réels des fichiers;
- paiements, soldes, remboursements et reçus juridiquement valides;
- notifications push, e-mails et temps réel véritables;
- atomicité des capacités, stocks, plafonds et réservations;
- audit inaltérable, conformité et protection contre la fraude.
