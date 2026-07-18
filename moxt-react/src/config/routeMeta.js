/** Public marketing / legal URLs worth indexing (sitemap + robots Allow). */
export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/presentation',
  '/discover',
  '/trust',
  '/faq',
  '/legal/mentions',
  '/legal/cgu',
  '/legal/privacy',
]

export function isPublicIndexablePath(pathname) {
  if (PUBLIC_INDEXABLE_PATHS.includes(pathname)) return true
  if (pathname === '/legal' || pathname === '/privacy') return true
  return false
}

export const routeMetadata = [
  {
    pattern: /^\/$/,
    title: 'MOXT — Services Bénin · Russie',
    eyebrow: 'MOXT',
    description:
      'MOXT — transferts, colis, marketplace, jobs et entreprises entre le Bénin et la Russie.',
  },
  {
    pattern: /^\/presentation$/,
    title: 'Présentation',
    eyebrow: 'MOXT',
    description:
      'Découvrez MOXT : services pour la diaspora africaine entre le Bénin et la Russie.',
  },
  {
    pattern: /^\/discover$/,
    title: 'Découvrir',
    eyebrow: 'MOXT',
    description: 'Explorez entreprises, annonces, colis, jobs et événements sur MOXT.',
  },
  {
    pattern: /^\/trust$/,
    title: 'Confiance',
    eyebrow: 'MOXT',
    description:
      'Vérification, messagerie sécurisée et principes de confiance sur la plateforme MOXT.',
  },
  {
    pattern: /^\/faq$/,
    title: 'FAQ',
    eyebrow: 'MOXT',
    description: 'Questions fréquentes sur la vérification, la publication et l’usage de MOXT.',
  },
  {
    pattern: /^\/legal(\/|$)/,
    title: 'Informations légales',
    eyebrow: 'MOXT',
    description: 'Mentions légales, CGU et politique de confidentialité MOXT.',
  },
  { pattern: /^\/dashboard$/, title: 'Accueil', eyebrow: 'MOXT' },
  {
    pattern: /^\/moxt$/,
    title: 'MOXT',
    eyebrow: 'Plateforme',
    description: 'Tous les services MOXT : essentiels, actions rapides et compte.',
  },
  { pattern: /^\/activities$/, title: 'Mes activités', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/favorites$/, title: 'Mes favoris', eyebrow: 'Compte', back: '/profile' },
  {
    pattern: /^\/users\/[^/]+\/publications$/,
    title: 'Publications du membre',
    eyebrow: 'Communauté',
    back: '/dashboard',
  },
  {
    pattern: /^\/users\/[^/]+\/annonces$/,
    title: 'Publications du membre',
    eyebrow: 'Communauté',
    back: '/dashboard',
  },
  { pattern: /^\/documents$/, title: 'Mes documents', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/verification$/, title: 'Vérification', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/security$/, title: 'Sécurité', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/subscriptions$/, title: 'Abonnements', eyebrow: 'Communauté', back: '/profile' },
  { pattern: /^\/profile$/, title: 'Mon profil', eyebrow: 'Compte' },
  { pattern: /^\/referral$/, title: 'QR code & invitation', eyebrow: 'Compte' },
  {
    pattern: /^\/profile\/information$/,
    title: 'Informations personnelles',
    eyebrow: 'Compte',
    back: '/profile',
  },
  { pattern: /^\/settings$/, title: 'Paramètres', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/local-data$/, title: 'Données locales', eyebrow: 'Compte', back: '/profile' },
  { pattern: /^\/news$/, title: 'Actualités', eyebrow: 'Communauté' },
  {
    pattern: /^\/transfers\/new$/,
    title: 'Nouveau transfert',
    eyebrow: 'Finances',
    back: '/transfers',
  },
  {
    pattern: /^\/transfers\/[^/]+$/,
    title: 'Détail du transfert',
    eyebrow: 'Finances',
    back: '/transfers',
  },
  { pattern: /^\/transfers$/, title: 'Nouveau transfert', eyebrow: 'Finances' },
  { pattern: /^\/transfers\/history$/, title: 'Historique des transferts', eyebrow: 'Finances' },
  { pattern: /^\/exchangers$/, title: 'Échangeurs', eyebrow: 'Finances' },
  {
    pattern: /^\/exchangers\/[^/]+$/,
    title: 'Fiche échangeur',
    eyebrow: 'Finances',
    back: '/exchangers',
  },
  { pattern: /^\/wallet$/, title: 'Portefeuille', eyebrow: 'Finances' },
  { pattern: /^\/payments$/, title: 'Paiements', eyebrow: 'Finances' },
  { pattern: /^\/receipts$/, title: 'Reçus', eyebrow: 'Finances' },
  { pattern: /^\/disputes$/, title: 'Mes litiges', eyebrow: 'Compte' },
  {
    pattern: /^\/businesses\/[^/]+$/,
    title: 'Fiche entreprise',
    eyebrow: 'Services',
    back: '/businesses',
  },
  { pattern: /^\/businesses$/, title: 'Entreprises', eyebrow: 'Services' },
  { pattern: /^\/professional$/, title: 'Espace professionnel', eyebrow: 'Services' },
  {
    pattern: /^\/parcels\/[^/]+$/,
    title: 'Détail du colis',
    eyebrow: 'Services',
    back: '/parcels',
  },
  { pattern: /^\/parcels$/, title: 'Colis', eyebrow: 'Services' },
  {
    pattern: /^\/p2p\/orders\/[^/]+$/,
    title: 'Transaction P2P',
    eyebrow: 'Finances',
    back: '/p2p',
  },
  {
    pattern: /^\/p2p\/publish$/,
    title: 'Proposer une offre P2P',
    eyebrow: 'Finances',
    back: '/p2p',
  },
  {
    pattern: /^\/p2p\/[^/]+$/,
    title: 'Détail de l’offre P2P',
    eyebrow: 'Finances',
    back: '/p2p',
  },
  { pattern: /^\/p2p$/, title: 'Échanges P2P', eyebrow: 'Finances' },
  {
    pattern: /^\/publications\/mine$/,
    title: 'Mes publications',
    eyebrow: 'Compte',
    back: '/dashboard',
  },
  {
    pattern: /^\/marketplace\/mine$/,
    title: 'Mes publications',
    eyebrow: 'Compte',
    back: '/dashboard',
  },
  {
    pattern: /^\/marketplace\/[^/]+\/edit$/,
    title: 'Modifier l’annonce',
    eyebrow: 'Marketplace',
    back: '/publications/mine?type=listing',
  },
  {
    pattern: /^\/marketplace\/[^/]+$/,
    title: 'Détail de l’annonce',
    eyebrow: 'Services',
    back: '/marketplace',
  },
  { pattern: /^\/marketplace$/, title: 'Marketplace', eyebrow: 'Services' },
  {
    pattern: /^\/jobs\/applications$/,
    title: 'Demandes de job',
    eyebrow: 'Communauté',
    back: '/jobs',
  },
  {
    pattern: /^\/jobs\/publish$/,
    title: 'Publier un job',
    eyebrow: 'Communauté',
    back: '/jobs',
  },
  {
    pattern: /^\/jobs\/[^/]+$/,
    title: 'Fiche job',
    eyebrow: 'Communauté',
    back: '/jobs',
  },
  { pattern: /^\/jobs$/, title: 'Jobs', eyebrow: 'Communauté' },
  {
    pattern: /^\/events\/[^/]+$/,
    title: 'Détail de l’événement',
    eyebrow: 'Communauté',
    back: '/events',
  },
  { pattern: /^\/events$/, title: 'Événements', eyebrow: 'Communauté' },
  { pattern: /^\/messages$/, title: 'Messagerie', eyebrow: 'Communication' },
  { pattern: /^\/notifications$/, title: 'Notifications', eyebrow: 'Communication' },
  { pattern: /^\/support$/, title: 'Support', eyebrow: 'Communication' },
  { pattern: /^\/design-system$/, title: 'Design system', eyebrow: 'Référence' },
  { pattern: /^\/design-directions$/, title: 'Design directions', eyebrow: 'UX/UI' },
  { pattern: /^\/design-directions\/[abc]$/, title: 'Mockup direction', eyebrow: 'UX/UI' },
  {
    pattern: /^\/feature-matrix$/,
    title: 'Couverture fonctionnelle',
    eyebrow: 'Administration',
  },
  { pattern: /^\/moderation$/, title: 'Espace modérateur', eyebrow: 'Modération' },
  { pattern: /^\/admin$/, title: 'Centre de contrôle', eyebrow: 'Administration' },
  { pattern: /^\/superadmin$/, title: 'Pilotage système', eyebrow: 'Superadmin' },
]

export function getRouteMetadata(pathname) {
  const meta =
    routeMetadata.find((route) => route.pattern.test(pathname)) || {
      title: 'MOXT',
      eyebrow: 'Espace personnel',
    }

  return {
    ...meta,
    description: meta.description || buildRouteDescription(meta, pathname),
  }
}

const eyebrowDescriptions = {
  MOXT: 'Tableau de bord et accès rapide aux services MOXT entre le Bénin et la Russie.',
  Compte: 'Gestion du profil, documents, sécurité et préférences personnelles.',
  Finances: 'Transferts, portefeuille, paiements, reçus et échanges financiers.',
  Services: 'Marketplace, colis, entreprises et services professionnels vérifiés.',
  Communauté: 'Jobs, événements, actualités et vie de la diaspora afro-russe.',
  Communication: 'Messagerie, notifications et support utilisateur.',
  Administration: 'Modération, pilotage et outils internes MOXT.',
  Superadmin: 'Pilotage système et configuration avancée de la plateforme.',
  Référence: 'Référentiel UI et couverture fonctionnelle du frontend MOXT.',
}

function buildRouteDescription(meta, pathname) {
  if (pathname.startsWith('/marketplace/') && pathname !== '/marketplace/publish') {
    return 'Consultez le détail de l’annonce, contactez le vendeur et finalisez votre achat.'
  }
  if (pathname.startsWith('/transfers/') && pathname !== '/transfers/new') {
    return 'Suivez le statut du transfert, déposez vos preuves et consultez la chronologie.'
  }
  if (pathname.startsWith('/businesses/')) {
    return 'Découvrez les services, avis et coordonnées de cette entreprise MOXT.'
  }
  return `${meta.title} — ${eyebrowDescriptions[meta.eyebrow] || 'Services MOXT entre le Bénin et la Russie.'}`
}
