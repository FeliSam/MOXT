import {
  FiActivity,
  FiBell,
  FiGift,
  FiGrid,
  FiHeart,
  FiList,
  FiMessageSquare,
  FiSettings,
  FiUser,
} from 'react-icons/fi'

/** Destinations secondaires du hub MOXT (compte, communication, outils). */
export const moxtHubSecondaryLinks = [
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
