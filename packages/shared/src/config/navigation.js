/** Navigation principale — labels FR (source i18n), routes web et clés Expo. */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', labelKey: 'nav.home', path: '/dashboard', mobileRoute: 'index' },
  {
    id: 'transfers',
    label: 'Transferts',
    labelKey: 'nav.transfers',
    path: '/transfers',
    mobileRoute: 'transfers',
  },
  { id: 'parcels', label: 'Colis', labelKey: 'nav.parcels', path: '/parcels', mobileRoute: 'parcels' },
  {
    id: 'marketplace',
    label: 'Marketplace',
    labelKey: 'nav.marketplace',
    path: '/marketplace',
    mobileRoute: 'marketplace',
  },
  { id: 'jobs', label: 'Jobs', labelKey: 'nav.jobs', path: '/jobs', mobileRoute: 'jobs' },
  {
    id: 'messages',
    label: 'Messages',
    labelKey: 'nav.messages',
    path: '/messages',
    mobileRoute: 'messages',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    labelKey: 'nav.notifications',
    path: '/notifications',
    mobileRoute: 'notifications',
  },
];

const primaryById = Object.fromEntries(primaryNavigationItems.map((item) => [item.id, item]));

/** Bottom nav mobile — Accueil → Transferts → Marketplace → Colis (+ Plus dans l'app) */
export const bottomNavigationItems = [
  primaryById.home,
  primaryById.transfers,
  primaryById.marketplace,
  primaryById.parcels,
];

export const bottomNavigationPaths = new Set(bottomNavigationItems.map((item) => item.path));

/** Masqué dans le menu Plus — déjà dans la bottom nav ou l'en-tête */
export const sidebarMobileHiddenPaths = new Set([
  '/dashboard',
  '/transfers',
  '/marketplace',
  '/parcels',
  '/messages',
  '/notifications',
  '/jobs/applications',
]);

export const moreServicesExcludedPaths = new Set([
  ...bottomNavigationPaths,
  ...sidebarMobileHiddenPaths,
]);
