import {
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiMessageSquare,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiUsers,
} from 'react-icons/fi'

export const PUBLIC_SERVICES = [
  {
    id: 'transfers',
    label: 'Transferts',
    description: 'Estimez et suivez vos opérations entre l’Afrique et la Russie.',
    icon: FiRepeat,
  },
  {
    id: 'parcels',
    label: 'Colis',
    description: 'Trouvez des capacités de transport et réservez des kilos.',
    icon: FiBox,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    description: 'Découvrez des produits, services, locations et opportunités.',
    icon: FiShoppingBag,
  },
  {
    id: 'businesses',
    label: 'Entreprises',
    description: 'Consultez les profils professionnels et leurs services.',
    icon: FiBriefcase,
  },
  {
    id: 'community',
    label: 'Communauté',
    description: 'Jobs, événements et échanges P2P dans un même espace.',
    icon: FiUsers,
  },
  {
    id: 'messages',
    label: 'Communication',
    description: 'Contactez le bon interlocuteur depuis chaque fiche.',
    icon: FiMessageSquare,
  },
]

export const TRUST_PRINCIPLES = [
  {
    icon: FiSmartphone,
    title: 'Numéro russe vérifié pour publier',
    description:
      'Annonces, colis, jobs et événements exigent un numéro +7 confirmé par SMS. Un numéro unique par compte.',
  },
  {
    icon: FiShield,
    title: 'Identité MOXT pour les opérations sensibles',
    description:
      'Créer une entreprise ou utiliser les comptes de transfert nécessite une identité validée et un enregistrement valide.',
  },
  {
    icon: FiMessageSquare,
    title: 'Échanges dans MOXT',
    description: 'Messagerie, favoris et contact restent accessibles sans vérification renforcée.',
  },
  {
    icon: FiRepeat,
    title: 'Ne jamais anticiper une validation',
    description: 'Une déclaration locale ne remplace pas la confirmation officielle d’un paiement ou d’un statut.',
  },
]

export const FAQ_ITEMS = [
  {
    question: 'Pourquoi dois-je confirmer mon numéro russe ?',
    answer:
      'Pour publier une annonce, un colis, un job ou un événement, MOXT exige un numéro +7 vérifié par SMS. Cela limite les faux comptes et protège la communauté. La messagerie reste accessible sans cette étape.',
  },
  {
    question: 'Quels sont les trois niveaux de vérification ?',
    answer:
      '1) Téléphone russe (OTP) pour publier. 2) Identité MOXT (pièce + selfie) pour entreprise et transferts. 3) Renforcée (+ justificatif de domicile) pour des plafonds plus élevés.',
  },
  {
    question: 'J’ai créé mon compte avec un e-mail, dois-je vérifier mon téléphone ?',
    answer:
      'Oui, avant toute publication. Confirmez votre numéro +7 depuis Profil ou Vérification. Si vous changez de numéro, une nouvelle confirmation est demandée.',
  },
  {
    question: 'Comment contacter une entreprise ou un vendeur ?',
    answer:
      'Connectez-vous, ouvrez la fiche concernée puis utilisez le bouton Contacter. Une conversation liée au contenu sera créée.',
  },
  {
    question: 'Mon dossier de vérification est en attente depuis plus de 24 h',
    answer:
      'Contactez l’administrateur via le support MOXT avec votre identifiant de compte. L’équipe pourra accélérer le traitement.',
  },
  {
    question: 'Comment signaler un contenu problématique ?',
    answer:
      'Utilisez le signalement disponible sur les fiches. Les modérateurs MOXT traitent les signalements prioritaires.',
  },
]

export const DISCOVERY_TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'business', label: 'Entreprises' },
  { value: 'listing', label: 'Marketplace' },
  { value: 'parcel', label: 'Colis' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Événements' },
]

export const LEGAL_SECTIONS = [
  {
    id: 'mentions',
    title: 'Mentions légales',
    content:
      'MOXT est une plateforme de services pour la diaspora afro-russe. L’éditeur du service est responsable du traitement des données conformément à la réglementation applicable. Contact : support@moxtapp.ru.',
  },
  {
    id: 'cgu',
    title: 'Conditions générales d’utilisation',
    content:
      'En créant un compte, vous acceptez d’utiliser MOXT de manière loyale, de fournir des informations exactes et de respecter les règles de vérification (téléphone, identité). Toute publication frauduleuse peut entraîner la suspension du compte.',
  },
  {
    id: 'privacy',
    title: 'Politique de confidentialité',
    content:
      'MOXT collecte les données nécessaires au compte (identité, téléphone, documents de vérification) et à la fourniture des services. Un e-mail ou numéro vérifié ne peut servir qu’à deux comptes au maximum ; après suppression, une réinscription est possible avec les mêmes identifiants. Vous pouvez demander la suppression de votre compte depuis les paramètres.',
  },
]

export const PUBLIC_RECENT_LIMIT = 6

export { FiCalendar }
