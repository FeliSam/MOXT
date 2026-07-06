import {
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiMessageSquare,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'

export const PUBLIC_SERVICES = [
  {
    id: 'transfers',
    label: 'Transferts',
    description: 'Estimez et suivez vos opérations entre le Bénin et la Russie.',
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
    icon: FiShield,
    title: 'Vérifier avant d’agir',
    description: 'Contrôlez le profil, le statut et les informations de l’interlocuteur.',
  },
  {
    icon: FiMessageSquare,
    title: 'Conserver les échanges',
    description: 'Utilisez la messagerie MOXT pour garder le contexte de vos demandes.',
  },
  {
    icon: FiRepeat,
    title: 'Ne jamais anticiper une validation',
    description: 'Une simulation ou une déclaration locale ne confirme aucun paiement réel.',
  },
]

export const FAQ_ITEMS = [
  {
    question: 'MOXT réalise-t-il actuellement de vrais paiements ?',
    answer:
      'Non. La version actuelle est une démonstration front-end. Les montants, statuts et paiements sont simulés localement.',
  },
  {
    question: 'Mes données sont-elles disponibles sur un autre appareil ?',
    answer:
      'Pas encore. Les données sont stockées dans ce navigateur jusqu’à la connexion du backend.',
  },
  {
    question: 'Comment contacter une entreprise ou un vendeur ?',
    answer:
      'Connectez-vous, ouvrez la fiche concernée puis utilisez le bouton Contacter. Une conversation liée au contenu sera créée.',
  },
  {
    question: 'Comment créer un espace professionnel ?',
    answer:
      'Après connexion, ouvrez Entreprises, complétez votre profil puis accédez à l’Espace professionnel.',
  },
  {
    question: 'Comment signaler un contenu problématique ?',
    answer:
      'Les annonces disposent d’un signalement local. La file de modération sera complétée avant la connexion du backend.',
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

export const PUBLIC_RECENT_LIMIT = 6

export { FiCalendar }
