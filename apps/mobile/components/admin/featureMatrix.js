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
        note: 'Navigation sans rechargement, guards auth/invité, deep links et chargement différé.',
      },
      {
        id: 'theme',
        label: 'Design system et thème clair/sombre',
        status: 'complete',
        note: 'Thème light/dark/system persistant, composants communs et barre de statut native.',
      },
      {
        id: 'quality',
        label: 'Validation automatisée et E2E métier',
        status: 'complete',
        note: 'Vitest, Playwright (parcours métier, a11y axe, clavier, thèmes) et budgets de livraison dans validate.',
      },
      {
        id: 'architecture',
        label: 'Architecture modulaire par domaine',
        status: 'complete',
        note: 'Slices Redux, middleware, services et pages lazy-loadés par domaine (auth, transferts, marketplace, admin).',
      },
      {
        id: 'local-data-health',
        label: 'Diagnostic et migrations des données locales',
        status: 'complete',
        note: 'Schéma versionné, rapport de santé, export et remise à zéro sélective.',
      },
      {
        id: 'i18n',
        label: 'Internationalisation (fr, en, ru, pt, es)',
        status: 'complete',
        note: 'Cinq langues, contexte global, locales chargées à la demande et sync profil.',
      },
      {
        id: 'media-yandex',
        label: 'Médias et stockage Yandex',
        status: 'complete',
        note: 'Upload via API média (presign/finalize), URLs signées et cache mobile ; repli Supabase selon configuration.',
      },
      {
        id: 'mobile-capacitor',
        label: 'Application mobile Capacitor',
        status: 'complete',
        note: 'Shell Android/iOS : splash, retour matériel, deep links, push, cache média et synchro Capacitor.',
      },
    ],
  },
  {
    domain: 'Compte',
    features: [
      {
        id: 'auth',
        label: 'Connexion, inscription et profil',
        status: 'complete',
        note: 'Auth Supabase réelle : OTP SMS/e-mail, mot de passe, callback, sessions et profil.',
      },
      {
        id: 'verification',
        label: 'Vérification et documents personnels',
        status: 'complete',
        note: 'Dépôt KYC, upload média, file admin reject/resubmit et suivi du statut de vérification.',
      },
      {
        id: 'preferences',
        label: 'Préférences et confidentialité',
        status: 'complete',
        note: 'Langue, thème, notifications et confidentialité persistés et appliqués dans l’app.',
      },
      {
        id: 'favorites',
        label: 'Favoris et profils de transfert',
        status: 'complete',
        note: 'Favoris par type (annonces, colis, jobs, autres) et profils bénéficiaire réutilisables.',
      },
    ],
  },
  {
    domain: 'Services',
    features: [
      {
        id: 'transfers',
        label: 'Transferts et suivi',
        status: 'complete',
        note: 'Création, acceptation, preuves, litiges, auto-clôture 24 h après versement, comptes changeur et dashboard.',
      },
      {
        id: 'businesses',
        label: 'Entreprises et espace professionnel',
        status: 'complete',
        note: 'Création, modération, dashboard pro, publications entreprise et espace membre.',
      },
      {
        id: 'parcels',
        label: 'Colis et réservations',
        status: 'complete',
        note: 'Publication, demande, annulation, preuves voyage, capacité restante et suivi du dossier.',
      },
      {
        id: 'p2p',
        label: 'P2P, preuves et litiges',
        status: 'complete',
        note: 'Offres, commandes, preuves, messagerie liée et résolution admin des litiges.',
      },
      {
        id: 'payments-receipts',
        label: 'Paiements et reçus',
        status: 'complete',
        note: 'Reçus transfert (local + sync), export et partage depuis le suivi d’opération.',
      },
      {
        id: 'moxt-stars',
        label: 'MOXT Stars',
        status: 'complete',
        note: 'Wallet, achat stub, quotas, boost fil, cadeaux abonnements, admin pricing/rollout et flags modules.',
      },
    ],
  },
  {
    domain: 'Communauté',
    features: [
      {
        id: 'marketplace',
        label: 'Marketplace et modération',
        status: 'complete',
        note: 'Catalogue, fiche, contact vendeur, favoris et file de modération.',
      },
      {
        id: 'publications-catalog',
        label: 'Catalogue unifié des publications',
        status: 'complete',
        note: 'Mes publications, profil membre et entreprise : types, actives/archives, cartes et masquage des onglets vides.',
      },
      {
        id: 'jobs',
        label: 'Jobs et candidatures',
        status: 'complete',
        note: 'Publication, candidature, acceptation/refus recruteur et suivi des dossiers.',
      },
      {
        id: 'events',
        label: 'Événements et inscriptions',
        status: 'complete',
        note: 'Publication, inscription, liste des participants et gestion par l’organisateur.',
      },
      {
        id: 'business-videos',
        label: 'Vidéos entreprise',
        status: 'complete',
        note: 'Publication business-only, catalogue Mes publications / profil / entreprise, feed mobile snap et desktop type publications.',
      },
      {
        id: 'reviews',
        label: 'Avis et réputation',
        status: 'complete',
        note: 'Avis multi-cibles, éligibilité, réponses, contestation, agrégats et modération admin.',
      },
    ],
  },
  {
    domain: 'Communication',
    features: [
      {
        id: 'messages',
        label: 'Messagerie contextuelle',
        status: 'complete',
        note: 'Conversations liées aux dossiers, pièces jointes, brouillons, épinglage et traduction auto P2P.',
      },
      {
        id: 'assistant',
        label: 'Moxti (assistant IA)',
        status: 'complete',
        note: 'Moxti agent: brouillon local + tools (transferts, search, échangeurs, playbooks) + reformulation Yandex ; actions et citations.',
      },
      {
        id: 'support',
        label: 'Support et notifications',
        status: 'complete',
        note: 'Tickets, chat admin, notifications in-app/push et préférences de canaux.',
      },
    ],
  },
  {
    domain: 'Administration',
    features: [
      {
        id: 'moderation',
        label: 'Modération multi-domaines',
        status: 'complete',
        note: 'Files contenu, colis, avis, P2P et vérifications, avec actions admin et suivi des dossiers.',
      },
      {
        id: 'audit',
        label: 'Journal d’audit',
        status: 'complete',
        note: 'Journal local + Supabase, export JSON et consultation depuis le centre d’administration.',
      },
      {
        id: 'users',
        label: 'Gestion des utilisateurs et vérifications',
        status: 'complete',
        note: 'Liste, rôles Supabase, suspensions et files de vérification depuis l’admin.',
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
