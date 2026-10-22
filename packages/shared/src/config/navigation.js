/**
 * Navigation principale partagée web ↔ mobile.
 * Alignée sur moxt-react/src/config/primaryNavigation.js (même ordre, mêmes libellés).
 * - `icon` : nom d’icône Feather (react-icons/fi côté web, @expo/vector-icons côté Expo).
 * - `mobileRoute` : nom de route expo-router (dossier app/(tabs) ou pile racine).
 * Le web ne consomme ici que `moreServicesExcludedPaths` et `sidebarMobileHiddenPaths`.
 */
export const primaryNavigationItems = [
  { id: 'home', label: 'Accueil', labelKey: 'nav.home', path: '/dashboard', mobileRoute: 'index', icon: 'home' },
  {
    id: 'transfers',
    label: 'Transfert',
    labelKey: 'nav.transfer',
    path: '/transfers',
    mobileRoute: 'transfers',
    icon: 'repeat',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    labelKey: 'nav.marketplace',
    path: '/marketplace',
    mobileRoute: 'marketplace',
    icon: 'shopping-bag',
  },
  {
    id: 'parcels',
    label: 'Colis',
    labelKey: 'nav.parcels',
    path: '/parcels',
    mobileRoute: 'parcels',
    icon: 'box',
    devModule: 'parcels',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    labelKey: 'nav.jobs',
    path: '/jobs',
    mobileRoute: 'jobs/index',
    icon: 'briefcase',
    devModule: 'jobs',
  },
  {
    id: 'messages',
    label: 'Messagerie',
    labelKey: 'nav.messages',
    path: '/messages',
    mobileRoute: 'messages',
    icon: 'message-square',
    badgeSelector: 'messages',
  },
  {
    id: 'businesses',
    label: 'Mon entreprise',
    labelKey: 'nav.professional',
    path: '/professional',
    icon: 'grid',
    desktopOnly: true,
    requiresOwnedBusiness: true,
  },
  {
    id: 'exchanger-dashboard',
    label: 'Dashboard échangeur',
    labelKey: 'nav.exchangerDashboard',
    path: '/exchanger',
    icon: 'trending-up',
    desktopOnly: true,
    requiresOwnedBusiness: true,
  },
  {
    id: 'news',
    label: 'Actualités',
    labelKey: 'nav.news',
    path: '/news',
    icon: 'file-text',
    desktopOnly: true,
    devModule: 'news',
  },
];

const primaryById = Object.fromEntries(primaryNavigationItems.map((item) => [item.id, item]));

/** Barre du bas mobile : Transfert · Moxt · Market · Fil (+ Plus). « Moxt » et « Market » ne se traduisent pas. */
export const bottomNavigationItems = [
  primaryById.transfers,
  { ...primaryById.home, label: 'Moxt', labelKey: null },
  { ...primaryById.marketplace, label: 'Market', labelKey: null },
  {
    id: 'feed',
    label: 'Fil',
    labelKey: 'nav.feed',
    path: '/feed',
    mobileRoute: 'feed',
    icon: 'rss',
    devModule: 'feed',
  },
];

/** 5e emplacement « Plus » : ouvre le bottom sheet « Tous les services » (web MobileMoreDrawer). */
export const moreNavigationItem = {
  id: 'more',
  label: 'Plus',
  labelKey: 'nav.more',
  path: '/moxt',
  mobileRoute: 'moxt',
  icon: 'grid',
};

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
  '/videos',
  '/feed',
]);
