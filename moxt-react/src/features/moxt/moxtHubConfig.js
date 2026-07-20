import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiBookOpen,
  FiFileText,
  FiGift,
  FiGrid,
  FiHeart,
  FiHelpCircle,
  FiList,
  FiMessageSquare,
  FiPieChart,
  FiSettings,
  FiShield,
  FiUser,
} from 'react-icons/fi'

/** Liens secondaires du hub MOXT, regroupés par catégorie. */
export const moxtHubSecondaryGroups = [
  {
    id: 'account',
    titleKey: 'moxtHub.groups.account',
    links: [
      { id: 'profile', labelKey: 'nav.profile', path: '/profile', icon: FiUser },
      { id: 'personal-info', labelKey: 'profile.links.personalInfo', path: '/profile/information', icon: FiUser },
      { id: 'my-publications', labelKey: 'nav.myPublications', path: '/publications/mine', icon: FiList },
      { id: 'favorites', labelKey: 'nav.favorites', path: '/favorites', icon: FiHeart },
      { id: 'subscriptions', labelKey: 'nav.subscriptions', path: '/subscriptions', icon: FiBell },
      { id: 'activities', labelKey: 'profile.links.activities', path: '/activities', icon: FiActivity },
      { id: 'referral', labelKey: 'nav.qrInvitation', path: '/referral', icon: FiGift },
      { id: 'professional', labelKey: 'nav.professional', path: '/professional', icon: FiGrid },
    ],
  },
  {
    id: 'finance',
    titleKey: 'moxtHub.groups.finance',
    links: [
      { id: 'receipts', labelKey: 'profile.links.receipts', path: '/receipts', icon: FiFileText },
      { id: 'documents', labelKey: 'profile.links.documents', path: '/documents', icon: FiFileText },
      { id: 'disputes', labelKey: 'profile.links.disputes', path: '/disputes', icon: FiAlertTriangle },
    ],
  },
  {
    id: 'communication',
    titleKey: 'moxtHub.groups.communication',
    links: [
      { id: 'messages', labelKey: 'nav.messages', path: '/messages', icon: FiMessageSquare },
      { id: 'notifications', labelKey: 'nav.notifications', path: '/notifications', icon: FiBell },
      { id: 'support', labelKey: 'profile.links.support', path: '/support', icon: FiHelpCircle },
      { id: 'guide', labelKey: 'nav.guide', path: '/guide', icon: FiBookOpen },
    ],
  },
  {
    id: 'security',
    titleKey: 'moxtHub.groups.security',
    links: [
      { id: 'verification', labelKey: 'profile.links.verification', path: '/verification', icon: FiShield },
      { id: 'security', labelKey: 'profile.links.security', path: '/security', icon: FiShield },
      { id: 'settings', labelKey: 'nav.settings', path: '/settings', icon: FiSettings },
    ],
  },
]

/** @deprecated use moxtHubSecondaryGroups — flat list for tests / legacy */
export const moxtHubSecondaryLinks = moxtHubSecondaryGroups.flatMap((group) => group.links)

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
