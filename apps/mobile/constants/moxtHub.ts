import type { ImageSourcePropType } from 'react-native';

import type { FeatherName } from '@/components/chrome/icons';

/**
 * Page Moxt (menu « Plus ») — portage de moxt-react :
 * features/dashboard/dashboardConfig.js (coreServices, quickActions) et
 * features/moxt/moxtHubConfig.js (groupes secondaires, liens admin).
 * Images 3D locales (copies des fichiers web) : Metro ne doit pas indexer tout moxt-react.
 */
const img = {
  transfer: require('../assets/services/3d/service-transfer.png'),
  marketplace: require('../assets/services/3d/service-marketplace.png'),
  parcel: require('../assets/services/3d/service-parcel.png'),
  job: require('../assets/services/3d/service-job.png'),
  p2p: require('../assets/services/3d/service-p2p.png'),
  exchangers: require('../assets/services/3d/service-exchangers.png'),
  businesses: require('../assets/services/3d/service-businesses.png'),
  events: require('../assets/services/3d/service-events.png'),
  news: require('../assets/services/3d/service-news.png'),
  quickMarketplace: require('../assets/services/3d/quick-marketplace.png'),
  quickParcel: require('../assets/services/3d/quick-parcel.png'),
  quickJob: require('../assets/services/3d/quick-job.png'),
  quickEvent: require('../assets/services/3d/quick-event.png'),
} satisfies Record<string, ImageSourcePropType>;

export type BentoSize = 'hero' | 'featured' | 'medium' | 'compact';

/** Fond : linear-gradient(angle, color-mix(tint p%, surface) 0%, surface-muted 100%) ; sombre : rgba(tint, a). */
export type BentoSurface = { angle: number; tint: string; ratio: number; darkTint: string };

export type BentoItem = {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  tagKey?: string;
  /** Route web (référence) */
  path: string;
  /** Route Expo (null = pas encore d'écran natif) */
  route: string | null;
  image: ImageSourcePropType;
  size: BentoSize;
  surface: BentoSurface;
};

const TEAL = 'var(--app-teal)';

export const coreServices: BentoItem[] = [
  {
    id: 'transfers',
    titleKey: 'dashboard.config.services.transfers.title',
    descriptionKey: 'dashboard.config.services.transfers.description',
    tagKey: 'dashboard.config.services.transfers.tag',
    path: '/transfers',
    route: '/(tabs)/transfers',
    image: img.transfer,
    size: 'hero',
    surface: { angle: 135, tint: TEAL, ratio: 0.1694, darkTint: 'rgba(8,112,95,0.339)' },
  },
  {
    id: 'marketplace',
    titleKey: 'dashboard.config.services.marketplace.title',
    descriptionKey: 'dashboard.config.services.marketplace.description',
    tagKey: 'dashboard.config.services.marketplace.tag',
    path: '/marketplace',
    route: '/(tabs)/marketplace',
    image: img.marketplace,
    size: 'featured',
    surface: { angle: 160, tint: '#0ea5e9', ratio: 0.1452, darkTint: 'rgba(14,165,233,0.266)' },
  },
  {
    id: 'parcels',
    titleKey: 'dashboard.config.services.parcels.title',
    descriptionKey: 'dashboard.config.services.parcels.description',
    tagKey: 'dashboard.config.services.parcels.tag',
    path: '/parcels',
    route: '/(tabs)/parcels',
    image: img.parcel,
    size: 'medium',
    surface: { angle: 145, tint: '#d97706', ratio: 0.1089, darkTint: 'rgba(217,119,6,0.218)' },
  },
  {
    id: 'jobs',
    titleKey: 'dashboard.config.services.jobs.title',
    descriptionKey: 'dashboard.config.services.jobs.description',
    tagKey: 'dashboard.config.services.jobs.tag',
    path: '/jobs',
    route: '/jobs',
    image: img.job,
    size: 'medium',
    surface: { angle: 145, tint: '#7c3aed', ratio: 0.1089, darkTint: 'rgba(124,58,237,0.218)' },
  },
  {
    id: 'p2p',
    titleKey: 'dashboard.config.services.p2p.title',
    descriptionKey: 'dashboard.config.services.p2p.description',
    tagKey: 'dashboard.config.services.p2p.tag',
    path: '/p2p',
    route: '/p2p',
    image: img.p2p,
    size: 'compact',
    surface: { angle: 145, tint: '#0891b2', ratio: 0.0968, darkTint: 'rgba(8,145,178,0.194)' },
  },
  {
    id: 'exchangers',
    titleKey: 'dashboard.config.services.exchangers.title',
    descriptionKey: 'dashboard.config.services.exchangers.description',
    tagKey: 'dashboard.config.services.exchangers.tag',
    path: '/exchangers',
    route: '/exchangers',
    image: img.exchangers,
    size: 'compact',
    surface: { angle: 145, tint: '#08705f', ratio: 0.0968, darkTint: 'rgba(8,112,95,0.194)' },
  },
  {
    id: 'businesses',
    titleKey: 'dashboard.config.services.businesses.title',
    descriptionKey: 'dashboard.config.services.businesses.description',
    tagKey: 'dashboard.config.services.businesses.tag',
    path: '/businesses',
    route: '/organization',
    image: img.businesses,
    size: 'compact',
    surface: { angle: 145, tint: '#245de8', ratio: 0.0968, darkTint: 'rgba(36,93,232,0.194)' },
  },
  {
    id: 'events',
    titleKey: 'dashboard.config.services.events.title',
    descriptionKey: 'dashboard.config.services.events.description',
    tagKey: 'dashboard.config.services.events.tag',
    path: '/events',
    route: '/events',
    image: img.events,
    size: 'compact',
    surface: { angle: 145, tint: '#ea580c', ratio: 0.0968, darkTint: 'rgba(234,88,12,0.194)' },
  },
  {
    id: 'news',
    titleKey: 'dashboard.config.services.news.title',
    descriptionKey: 'dashboard.config.services.news.description',
    tagKey: 'dashboard.config.services.news.tag',
    path: '/news',
    route: null,
    image: img.news,
    size: 'compact',
    surface: { angle: 145, tint: '#db2777', ratio: 0.0968, darkTint: 'rgba(219,39,119,0.194)' },
  },
];

export const quickActions: BentoItem[] = [
  {
    id: 'qa-listing',
    titleKey: 'dashboard.config.quickActions.listing.label',
    descriptionKey: 'dashboard.config.quickActions.listing.description',
    path: '/marketplace/publish',
    route: '/listing/create',
    image: img.quickMarketplace,
    size: 'hero',
    surface: { angle: 160, tint: '#0891b2', ratio: 0.1452, darkTint: 'rgba(8,145,178,0.266)' },
  },
  {
    id: 'qa-parcel',
    titleKey: 'dashboard.config.quickActions.parcel.label',
    descriptionKey: 'dashboard.config.quickActions.parcel.description',
    path: '/parcels/publish',
    route: null,
    image: img.quickParcel,
    size: 'featured',
    surface: { angle: 145, tint: '#245de8', ratio: 0.1089, darkTint: 'rgba(36,93,232,0.218)' },
  },
  {
    id: 'qa-transfer',
    titleKey: 'dashboard.config.quickActions.transfer.label',
    descriptionKey: 'dashboard.config.quickActions.transfer.description',
    path: '/transfers',
    route: '/(tabs)/transfers',
    image: img.transfer,
    size: 'medium',
    surface: { angle: 135, tint: TEAL, ratio: 0.1694, darkTint: 'rgba(8,112,95,0.339)' },
  },
  {
    id: 'qa-job',
    titleKey: 'dashboard.config.quickActions.job.label',
    descriptionKey: 'dashboard.config.quickActions.job.description',
    path: '/jobs/publish',
    route: null,
    image: img.quickJob,
    size: 'medium',
    surface: { angle: 145, tint: '#b45309', ratio: 0.1089, darkTint: 'rgba(180,83,9,0.218)' },
  },
  {
    id: 'qa-event',
    titleKey: 'dashboard.config.quickActions.event.label',
    descriptionKey: 'dashboard.config.quickActions.event.description',
    path: '/events/publish',
    route: null,
    image: img.quickEvent,
    size: 'compact',
    surface: { angle: 145, tint: '#7c3aed', ratio: 0.0968, darkTint: 'rgba(124,58,237,0.194)' },
  },
];

export type HubLink = { id: string; labelKey: string; path: string; route: string | null; icon: FeatherName; roles?: string[] };

export const moxtHubSecondaryGroups: { id: string; titleKey: string; links: HubLink[] }[] = [
  {
    id: 'account',
    titleKey: 'moxtHub.groups.account',
    links: [
      { id: 'profile', labelKey: 'nav.profile', path: '/profile', route: '/profile/edit', icon: 'user' },
      { id: 'personal-info', labelKey: 'profile.links.personalInfo', path: '/profile/information', route: '/profile/edit', icon: 'user' },
      { id: 'my-publications', labelKey: 'nav.myPublications', path: '/publications/mine', route: '/listing/mine', icon: 'list' },
      { id: 'favorites', labelKey: 'nav.favorites', path: '/favorites', route: '/favorites', icon: 'heart' },
      { id: 'activities', labelKey: 'profile.links.activities', path: '/activities', route: '/activities', icon: 'activity' },
      { id: 'referral', labelKey: 'nav.qrInvitation', path: '/referral', route: '/referral', icon: 'gift' },
      { id: 'professional', labelKey: 'nav.professional', path: '/professional', route: '/professional', icon: 'grid' },
    ],
  },
  {
    id: 'finance',
    titleKey: 'moxtHub.groups.finance',
    links: [
      { id: 'contribute', labelKey: 'nav.contribute', path: '/contribute', route: '/contribute', icon: 'heart', roles: ['admin', 'superadmin'] },
      { id: 'receipts', labelKey: 'profile.links.receipts', path: '/receipts', route: null, icon: 'file-text' },
      { id: 'documents', labelKey: 'profile.links.documents', path: '/documents', route: '/documents', icon: 'file-text' },
      { id: 'disputes', labelKey: 'profile.links.disputes', path: '/disputes', route: '/disputes', icon: 'alert-triangle' },
    ],
  },
  {
    id: 'communication',
    titleKey: 'moxtHub.groups.communication',
    links: [
      { id: 'messages', labelKey: 'nav.messages', path: '/messages', route: '/(tabs)/messages', icon: 'message-square' },
      { id: 'notifications', labelKey: 'nav.notifications', path: '/notifications', route: '/(tabs)/notifications', icon: 'bell' },
      { id: 'support', labelKey: 'profile.links.support', path: '/support', route: '/support', icon: 'help-circle' },
      { id: 'guide', labelKey: 'nav.guide', path: '/guide', route: '/guide', icon: 'book-open' },
      { id: 'product-help', labelKey: 'nav.productHelp', path: '/aide', route: '/aide', icon: 'help-circle' },
    ],
  },
  {
    id: 'security',
    titleKey: 'moxtHub.groups.security',
    links: [
      { id: 'verification', labelKey: 'profile.links.verification', path: '/verification', route: '/kyc', icon: 'shield' },
      { id: 'security', labelKey: 'profile.links.security', path: '/security', route: '/security', icon: 'shield' },
      { id: 'settings', labelKey: 'nav.settings', path: '/settings', route: '/settings', icon: 'settings' },
    ],
  },
];

export const moxtHubAdminLinks: HubLink[] = [
  { id: 'contribute', labelKey: 'nav.contribute', path: '/contribute', route: '/contribute', icon: 'heart', roles: ['admin', 'superadmin'] },
  { id: 'guide-admin', labelKey: 'nav.guideAdmin', path: '/admin/guide', route: '/admin/guide', icon: 'book-open', roles: ['moderator', 'admin', 'superadmin'] },
  { id: 'moderation', labelKey: 'nav.moderationSpace', path: '/moderation', route: '/moderation', icon: 'shield', roles: ['moderator', 'admin', 'superadmin'] },
  { id: 'admin', labelKey: 'nav.controlCenter', path: '/admin', route: '/admin', icon: 'settings', roles: ['admin', 'superadmin'] },
  { id: 'feature-matrix', labelKey: 'nav.featureMatrix', path: '/feature-matrix', route: '/feature-matrix', icon: 'pie-chart', roles: ['admin', 'superadmin'] },
  { id: 'superadmin', labelKey: 'nav.systemPilotage', path: '/superadmin', route: '/superadmin', icon: 'shield', roles: ['superadmin'] },
];

export function filterHubLinksByRole(links: HubLink[], role?: string | null) {
  const normalized = String(role || 'user').toLowerCase();
  return links.filter((link) => !link.roles?.length || link.roles.some((r) => r.toLowerCase() === normalized));
}
