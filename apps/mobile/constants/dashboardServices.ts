import type { ImageSourcePropType } from 'react-native';

import type { ModuleId } from '@/store/platform';

export type BentoSize = 'hero' | 'featured' | 'medium' | 'compact';

/**
 * Services essentiels — copie de moxt-react/src/features/dashboard/dashboardConfig.js (coreServices).
 * `tint` / `pct` / `angle` reproduisent le dégradé clair
 *   linear-gradient(angle, color-mix(tint pct%, surface), surface-muted)
 * et `dark` la couleur rgba de départ en thème sombre.
 */
export type CoreService = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  tagKey: string;
  route: string;
  image: ImageSourcePropType;
  size: BentoSize;
  devModule?: ModuleId;
  angle: number;
  tint: string | 'teal';
  pct: number;
  dark: string;
};

export const CORE_SERVICES: CoreService[] = [
  {
    id: 'transfers',
    titleKey: 'dashboard.config.services.transfers.title',
    descriptionKey: 'dashboard.config.services.transfers.description',
    tagKey: 'dashboard.config.services.transfers.tag',
    route: '/(tabs)/transfers',
    image: require('../assets/services/3d/service-transfer.png'),
    size: 'hero',
    angle: 135,
    tint: 'teal',
    pct: 0.1694,
    dark: 'rgba(8,112,95,0.339)',
  },
  {
    id: 'marketplace',
    titleKey: 'dashboard.config.services.marketplace.title',
    descriptionKey: 'dashboard.config.services.marketplace.description',
    tagKey: 'dashboard.config.services.marketplace.tag',
    route: '/(tabs)/marketplace',
    image: require('../assets/services/3d/service-marketplace.png'),
    size: 'featured',
    angle: 160,
    tint: '#0ea5e9',
    pct: 0.1452,
    dark: 'rgba(14,165,233,0.266)',
  },
  {
    id: 'parcels',
    titleKey: 'dashboard.config.services.parcels.title',
    descriptionKey: 'dashboard.config.services.parcels.description',
    tagKey: 'dashboard.config.services.parcels.tag',
    route: '/(tabs)/parcels',
    image: require('../assets/services/3d/service-parcel.png'),
    size: 'medium',
    devModule: 'parcels',
    angle: 145,
    tint: '#d97706',
    pct: 0.1089,
    dark: 'rgba(217,119,6,0.218)',
  },
  {
    id: 'jobs',
    titleKey: 'dashboard.config.services.jobs.title',
    descriptionKey: 'dashboard.config.services.jobs.description',
    tagKey: 'dashboard.config.services.jobs.tag',
    route: '/jobs',
    image: require('../assets/services/3d/service-job.png'),
    size: 'medium',
    devModule: 'jobs',
    angle: 145,
    tint: '#7c3aed',
    pct: 0.1089,
    dark: 'rgba(124,58,237,0.218)',
  },
  {
    id: 'p2p',
    titleKey: 'dashboard.config.services.p2p.title',
    descriptionKey: 'dashboard.config.services.p2p.description',
    tagKey: 'dashboard.config.services.p2p.tag',
    route: '/exchangers',
    image: require('../assets/services/3d/service-p2p.png'),
    size: 'compact',
    angle: 145,
    tint: '#0891b2',
    pct: 0.0968,
    dark: 'rgba(8,145,178,0.194)',
  },
  {
    id: 'exchangers',
    titleKey: 'dashboard.config.services.exchangers.title',
    descriptionKey: 'dashboard.config.services.exchangers.description',
    tagKey: 'dashboard.config.services.exchangers.tag',
    route: '/exchangers',
    image: require('../assets/services/3d/service-exchangers.png'),
    size: 'compact',
    angle: 145,
    tint: '#08705f',
    pct: 0.0968,
    dark: 'rgba(8,112,95,0.194)',
  },
  {
    id: 'businesses',
    titleKey: 'dashboard.config.services.businesses.title',
    descriptionKey: 'dashboard.config.services.businesses.description',
    tagKey: 'dashboard.config.services.businesses.tag',
    route: '/organization',
    image: require('../assets/services/3d/service-businesses.png'),
    size: 'compact',
    angle: 145,
    tint: '#245de8',
    pct: 0.0968,
    dark: 'rgba(36,93,232,0.194)',
  },
  {
    id: 'events',
    titleKey: 'dashboard.config.services.events.title',
    descriptionKey: 'dashboard.config.services.events.description',
    tagKey: 'dashboard.config.services.events.tag',
    route: '/search',
    image: require('../assets/services/3d/service-events.png'),
    size: 'compact',
    devModule: 'events',
    angle: 145,
    tint: '#ea580c',
    pct: 0.0968,
    dark: 'rgba(234,88,12,0.194)',
  },
  {
    id: 'news',
    titleKey: 'dashboard.config.services.news.title',
    descriptionKey: 'dashboard.config.services.news.description',
    tagKey: 'dashboard.config.services.news.tag',
    route: '/(tabs)/feed',
    image: require('../assets/services/3d/service-news.png'),
    size: 'compact',
    devModule: 'news',
    angle: 145,
    tint: '#db2777',
    pct: 0.0968,
    dark: 'rgba(219,39,119,0.194)',
  },
];

/** Angle CSS (deg) → points start/end d'expo-linear-gradient. */
export function cssAngleToPoints(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.sin(rad) / 2;
  const y = Math.cos(rad) / 2;
  return { start: { x: 0.5 - x, y: 0.5 + y }, end: { x: 0.5 + x, y: 0.5 - y } };
}
