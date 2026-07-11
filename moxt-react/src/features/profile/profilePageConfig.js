import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiDatabase,
  FiFileText,
  FiGift,
  FiHeart,
  FiHelpCircle,
  FiPackage,
  FiRepeat,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'

export const roleLabels = {
  user: 'Utilisateur',
  professional: 'Professionnel',
  admin: 'Administrateur',
  superadmin: 'Superadministrateur',
}

export const accountSections = [
  {
    id: 'account',
    title: 'Mon compte',
    links: [
      {
        label: 'Informations personnelles',
        description: 'Identité et coordonnées',
        icon: FiUser,
        path: '/profile/information',
      },
      {
        label: 'Mes favoris',
        description: 'Contenus et profils de transfert',
        icon: FiHeart,
        path: '/favorites',
      },
      {
        label: 'Mes abonnements',
        description: 'Membres et entreprises suivis, alertes personnalisées',
        icon: FiBell,
        path: '/subscriptions',
      },
      {
        label: 'Mes activités',
        description: 'Candidatures, réservations et suivis',
        icon: FiActivity,
        path: '/activities',
      },
      {
        label: 'QR code & invitation',
        description: 'Invitez vos proches ou partagez votre profil',
        icon: FiGift,
        path: '/referral',
      },
    ],
  },
  {
    id: 'trust',
    title: 'Confiance & sécurité',
    links: [
      {
        label: 'Vérification',
        description: 'Documents et niveau de confiance',
        icon: FiCheckCircle,
        path: '/verification',
      },
      {
        label: 'Sécurité',
        description: 'Protection de votre compte',
        icon: FiShield,
        path: '/security',
      },
      {
        label: 'Paramètres',
        description: 'Préférences et confidentialité',
        icon: FiSettings,
        path: '/settings',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents & assistance',
    links: [
      {
        label: 'Documents',
        description: 'Fichiers et justificatifs personnels',
        icon: FiFileText,
        path: '/documents',
      },
      {
        label: 'Reçus',
        description: 'Historique et justificatifs de transfert',
        icon: FiFileText,
        path: '/receipts',
      },
      {
        label: 'Mes litiges',
        description: 'Suivi des contestations et résolutions',
        icon: FiAlertTriangle,
        path: '/disputes',
      },
      {
        label: 'Support',
        description: 'Aide et échanges avec l’équipe MOXT',
        icon: FiHelpCircle,
        path: '/support',
      },
      {
        label: 'Données locales',
        description: 'Diagnostic, sauvegarde et réinitialisation',
        icon: FiDatabase,
        path: '/local-data',
      },
    ],
  },
]

export const quickStatsConfig = [
  { label: 'Transferts', icon: FiRepeat, to: '/transfers/history', key: 'transfers' },
  { label: 'Publications', icon: FiShoppingBag, to: '/publications/mine', key: 'listings' },
  { label: 'Colis', icon: FiPackage, to: '/parcels', key: 'parcels' },
  { label: 'Favoris', icon: FiHeart, to: '/favorites', key: 'favorites' },
]

export function profileInitials(first = '', last = '') {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
}

export function profileCompletionPercent(user) {
  const fields = [user.firstName, user.lastName, user.email, user.phone, user.country, user.city]
  return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100)
}
