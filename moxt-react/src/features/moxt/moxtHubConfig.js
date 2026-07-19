import {
  FiActivity,
  FiBell,
  FiBookOpen,
  FiGift,
  FiGrid,
  FiHeart,
  FiList,
  FiMessageSquare,
  FiPieChart,
  FiSettings,
  FiShield,
  FiUser,
} from 'react-icons/fi'

/** Destinations secondaires du hub MOXT (compte, communication, outils). */
export const moxtHubSecondaryLinks = [
  {
    id: 'guide',
    labelKey: 'nav.guide',
    path: '/guide',
    icon: FiBookOpen,
  },
  {
    id: 'my-publications',
    labelKey: 'nav.myPublications',
    path: '/publications/mine',
    icon: FiList,
  },
  {
    id: 'favorites',
    labelKey: 'nav.favorites',
    path: '/favorites',
    icon: FiHeart,
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    path: '/profile',
    icon: FiUser,
  },
  {
    id: 'activities',
    labelKey: 'profile.links.activities',
    path: '/activities',
    icon: FiActivity,
  },
  {
    id: 'subscriptions',
    labelKey: 'nav.subscriptions',
    path: '/subscriptions',
    icon: FiBell,
  },
  {
    id: 'referral',
    labelKey: 'nav.qrInvitation',
    path: '/referral',
    icon: FiGift,
  },
  {
    id: 'messages',
    labelKey: 'nav.messages',
    path: '/messages',
    icon: FiMessageSquare,
  },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    path: '/notifications',
    icon: FiBell,
  },
  {
    id: 'professional',
    labelKey: 'nav.professional',
    path: '/professional',
    icon: FiGrid,
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    path: '/settings',
    icon: FiSettings,
  },
]

/** Liens réservés aux rôles staff / admin (alignés sur navigation.js). */
export const moxtHubAdminLinks = [
  {
    id: 'guide-admin',
    labelKey: 'nav.guideAdmin',
    path: '/admin/guide',
    icon: FiBookOpen,
    roles: ['moderator', 'admin', 'superadmin'],
  },
  {
    id: 'moderation',
    labelKey: 'nav.moderationSpace',
    path: '/moderation',
    icon: FiShield,
    roles: ['moderator', 'admin', 'superadmin'],
  },
  {
    id: 'admin',
    labelKey: 'nav.controlCenter',
    path: '/admin',
    icon: FiSettings,
    roles: ['admin', 'superadmin'],
  },
  {
    id: 'feature-matrix',
    labelKey: 'nav.featureMatrix',
    path: '/feature-matrix',
    icon: FiPieChart,
    roles: ['admin', 'superadmin'],
  },
  {
    id: 'superadmin',
    labelKey: 'nav.systemPilotage',
    path: '/superadmin',
    icon: FiShield,
    roles: ['superadmin'],
  },
]

export function filterMoxtHubLinksByRole(links, role) {
  if (!role) return []
  return links.filter((link) => !link.roles || link.roles.includes(role))
}
