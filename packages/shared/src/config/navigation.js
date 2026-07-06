/** Navigation principale — labels FR (source i18n), routes web et clés Expo. */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', path: '/dashboard', mobileRoute: 'index' },
  { id: 'transfers', label: 'Transferts', path: '/transfers', mobileRoute: 'transfers' },
  { id: 'parcels', label: 'Colis', path: '/parcels', mobileRoute: 'parcels' },
  { id: 'marketplace', label: 'Marketplace', path: '/marketplace', mobileRoute: 'marketplace' },
  { id: 'jobs', label: 'Jobs', path: '/jobs', mobileRoute: 'jobs' },
  { id: 'messages', label: 'Messages', path: '/messages', mobileRoute: 'messages' },
  { id: 'notifications', label: 'Notifications', path: '/notifications', mobileRoute: 'notifications' },
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
