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

export const roleLabelKeys = {
  user: 'profile.roles.user',
  professional: 'profile.roles.professional',
  admin: 'profile.roles.admin',
  superadmin: 'profile.roles.superadmin',
}

export const accountSections = [
  {
    id: 'account',
    titleKey: 'profile.sections.account',
    links: [
      {
        labelKey: 'profile.links.personalInfo',
        descriptionKey: 'profile.links.personalInfoDesc',
        icon: FiUser,
        path: '/profile/information',
      },
      {
        labelKey: 'profile.links.favorites',
        descriptionKey: 'profile.links.favoritesDesc',
        icon: FiHeart,
        path: '/favorites',
      },
      {
        labelKey: 'profile.links.subscriptions',
        descriptionKey: 'profile.links.subscriptionsDesc',
        icon: FiBell,
        path: '/subscriptions',
      },
      {
        labelKey: 'profile.links.activities',
        descriptionKey: 'profile.links.activitiesDesc',
        icon: FiActivity,
        path: '/activities',
      },
      {
        labelKey: 'profile.links.referral',
        descriptionKey: 'profile.links.referralDesc',
        icon: FiGift,
        path: '/referral',
      },
    ],
  },
  {
    id: 'trust',
    titleKey: 'profile.sections.trust',
    links: [
      {
        labelKey: 'profile.links.verification',
        descriptionKey: 'profile.links.verificationDesc',
        icon: FiCheckCircle,
        path: '/verification',
      },
      {
        labelKey: 'profile.links.security',
        descriptionKey: 'profile.links.securityDesc',
        icon: FiShield,
        path: '/security',
      },
      {
        labelKey: 'profile.links.settings',
        descriptionKey: 'profile.links.settingsDesc',
        icon: FiSettings,
        path: '/settings',
      },
    ],
  },
  {
    id: 'documents',
    titleKey: 'profile.sections.documents',
    links: [
      {
        labelKey: 'profile.links.documents',
        descriptionKey: 'profile.links.documentsDesc',
        icon: FiFileText,
        path: '/documents',
      },
      {
        labelKey: 'profile.links.receipts',
        descriptionKey: 'profile.links.receiptsDesc',
        icon: FiFileText,
        path: '/receipts',
      },
      {
        labelKey: 'profile.links.disputes',
        descriptionKey: 'profile.links.disputesDesc',
        icon: FiAlertTriangle,
        path: '/disputes',
      },
      {
        labelKey: 'profile.links.support',
        descriptionKey: 'profile.links.supportDesc',
        icon: FiHelpCircle,
        path: '/support',
      },
      {
        labelKey: 'profile.links.localData',
        descriptionKey: 'profile.links.localDataDesc',
        icon: FiDatabase,
        path: '/local-data',
      },
    ],
  },
]

export const quickStatsConfig = [
  { labelKey: 'profile.stats.transfers', icon: FiRepeat, to: '/transfers/history', key: 'transfers' },
  { labelKey: 'profile.stats.publications', icon: FiShoppingBag, to: '/publications/mine', key: 'listings' },
  { labelKey: 'profile.stats.parcels', icon: FiPackage, to: '/parcels', key: 'parcels' },
  { labelKey: 'profile.stats.favorites', icon: FiHeart, to: '/favorites', key: 'favorites' },
]

export function profileInitials(first = '', last = '') {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
}

export function profileCompletionPercent(user) {
  const fields = [user.firstName, user.lastName, user.email, user.phone, user.country, user.city]
  return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100)
}
