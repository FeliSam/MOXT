export const FEATURE_STATUS = {
  COMPLETE: 'complete',
  PARTIAL: 'partial',
  PLANNED: 'planned',
}

export const FEATURE_STATUS_META = {
  complete: { label: 'Complet', tone: 'success' },
  partial: { label: 'Partiel', tone: 'warning' },
  planned: { label: 'Planifié', tone: 'info' },
}

export const FEATURE_MATRIX = [
  {
    domain: 'Socle',
    features: [
      {
        id: 'spa',
        label: 'Navigation SPA et routes protégées',
        status: 'complete',
        note: 'Navigation sans rechargement, routes directes et chargement différé validés.',
      },
      {
        id: 'theme',
        label: 'Design system et thème clair/sombre',
        status: 'complete',
        note: 'Thème persistant et composants communs disponibles.',
      },
      {
        id: 'quality',
        label: 'Validation automatisée et E2E métier',
        status: 'partial',
        note: 'Le socle passe, mais tous les parcours, l’accessibilité et la régression visuelle ne sont pas couverts.',
      },
      {
        id: 'architecture',
        label: 'Architecture modulaire par domaine',
        status: 'partial',
        note: 'Les domaines sont séparés, mais plusieurs pages restent trop volumineuses et concentrent encore la logique métier.',
      },
      {
        id: 'local-data-health',
        label: 'Diagnostic et migrations des données locales',
        status: 'complete',
        note: 'Schéma versionné, rapport de santé, sauvegarde et remise à zéro sélective disponibles.',
      },
    ],
  },
  {
    domain: 'Compte',
    features: [
      {
        id: 'auth',
        label: 'Connexion, inscription et profil local',
        status: 'partial',
        note: 'Parcours local fonctionnel; sessions multiples, récupération complète et sécurité avancée restent simulées.',
      },
      {
        id: 'verification',
        label: 'Vérification et documents personnels',
        status: 'partial',
        note: 'Seules les métadonnées des fichiers sont conservées; contrôles, aperçu et cycle de correction restent à enrichir.',
      },
      {
        id: 'preferences',
        label: 'Préférences et confidentialité',
        status: 'partial',
        note: 'Les préférences sont enregistrées, mais la langue, les consentements et leurs effets globaux sont incomplets.',
      },
    ],
  },
  {
    domain: 'Services',
    features: [
      {
        id: 'transfers',
        label: 'Transferts et suivi',
        status: 'partial',
        note: 'Le parcours manuel existe; devis expirables, limites mensuelles, reprises d’erreur et suivi enrichi restent à compléter.',
      },
      {
        id: 'businesses',
        label: 'Entreprises et espace professionnel',
        status: 'partial',
        note: 'Création, modération et tableau de bord existent; édition, permissions internes et statistiques avancées restent partielles.',
      },
      {
        id: 'parcels',
        label: 'Colis et réservations',
        status: 'partial',
        note: 'Publication et demande existent; suivi, annulation, preuves, conflits de capacité et livraison restent incomplets.',
      },
      {
        id: 'p2p',
        label: 'P2P, preuves et litiges',
        status: 'partial',
        note: 'Les bases existent, mais les transitions, délais, permissions des deux parties et reprise de litige doivent être renforcés.',
      },
      {
        id: 'payments-receipts',
        label: 'Paiements et reçus',
        status: 'partial',
        note: 'Les parcours existent mais doivent encore être unifiés avec le suivi de transfert.',
      },
    ],
  },
  {
    domain: 'Communauté',
    features: [
      {
        id: 'marketplace',
        label: 'Marketplace et modération',
        status: 'partial',
        note: 'Catalogue et détail sont avancés; gestion des offres, réponses vendeur, stock et livraison restent à finaliser.',
      },
      {
        id: 'jobs',
        label: 'Jobs et candidatures',
        status: 'partial',
        note: 'Publication et candidature existent; CV, entretien, suivi recruteur et historique détaillé manquent.',
      },
      {
        id: 'events',
        label: 'Événements et inscriptions',
        status: 'partial',
        note: 'Publication et inscription existent; billets, liste d’attente, contrôle de présence et calendrier manquent.',
      },
      {
        id: 'reviews',
        label: 'Avis et réputation',
        status: 'partial',
        note: 'Les avis sont stockés et modérables; éligibilité, réponses, signalements et agrégats multi-domaines restent à ajouter.',
      },
    ],
  },
  {
    domain: 'Communication',
    features: [
      {
        id: 'messages',
        label: 'Messagerie contextuelle',
        status: 'partial',
        note: 'Conversations, recherche et interactions locales existent; brouillons, épinglage, mise en sourdine et pièces jointes enrichies manquent.',
      },
      {
        id: 'assistant',
        label: 'Assistant MOXT contextuel',
        status: 'partial',
        note: 'L’assistant local recherche et propose des liens; compréhension, contexte de page et actions guidées restent limités.',
      },
      {
        id: 'support',
        label: 'Support et notifications',
        status: 'partial',
        note: 'Tickets et notifications locales existent; catégories, priorisation, préférences effectives et centre de suivi restent incomplets.',
      },
    ],
  },
  {
    domain: 'Administration',
    features: [
      {
        id: 'moderation',
        label: 'Modération multi-domaines',
        status: 'partial',
        note: 'Les files principales existent; décisions motivées, actions groupées et historique détaillé manquent.',
      },
      {
        id: 'audit',
        label: 'Journal d’audit local',
        status: 'partial',
        note: 'Les actions sont journalisées localement; recherche, filtres, comparaison et export complet restent à ajouter.',
      },
      {
        id: 'users',
        label: 'Gestion des utilisateurs et vérifications',
        status: 'partial',
        note: 'Rôles et suspensions sont simulés; matrice de permissions, motifs, historique et vues de contrôle restent incomplets.',
      },
    ],
  },
]

export function featureMatrixSummary(matrix = FEATURE_MATRIX) {
  return matrix
    .flatMap((section) => section.features)
    .reduce(
      (summary, feature) => {
        summary.total += 1
        summary[feature.status] += 1
        return summary
      },
      { total: 0, complete: 0, partial: 0, planned: 0 },
    )
}
