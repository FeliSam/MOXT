# Checklist de branchement backend MOXT

## Authentification

- remplacer les comptes de démonstration par sessions serveur, rotation et révocation;
- appliquer les rôles et permissions côté serveur;
- ajouter récupération de compte, vérification e-mail/téléphone et 2FA réelles.

## Données métier

- créer des identifiants serveur et une version optimiste pour chaque ressource;
- remplacer les dépôts locaux par des adaptateurs API sans changer les composants;
- garantir atomicité des stocks, capacités colis, plafonds et transitions de transfert;
- migrer les données locales seulement après consentement et contrôle des doublons.

## Entreprises

- imposer l’unicité d’entreprise par propriétaire en base;
- gérer invitations, membres, validation admin et historique inaltérable;
- protéger les coordonnées de paiement et documents de vérification.

## Transferts et paiements

- conserver `simulation: true` jusqu’à intégration d’un prestataire agréé;
- signer les preuves et reçus côté serveur;
- vérifier chaque transition, montant, devise, délai et propriétaire;
- ajouter webhooks idempotents, rapprochement et journal financier.

## Communication

- stocker conversations, accusés, pièces jointes et notifications côté serveur;
- vérifier les participants à chaque lecture et écriture;
- ajouter temps réel, antivirus des fichiers, quotas et modération;
- remplacer `AssistantProvider` par une API authentifiée avec politique de données.

## Exploitation

- journalisation structurée, métriques, alertes, sauvegardes et restauration;
- politique de rétention, export, suppression et conformité;
- tests de charge, sécurité, migrations et reprise après incident;
- environnements séparés, secrets gérés et déploiement automatisé.
