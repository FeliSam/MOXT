/**
 * Titres d'en-tête par route Expo — repris de moxt-react/src/config/routeMeta.js
 * (libellés FR source, traduits via translateLabel).
 */
export const TAB_ROUTE_PATHS: Record<string, string> = {
  index: '/dashboard',
  transfers: '/transfers',
  marketplace: '/marketplace',
  feed: '/feed',
  moxt: '/moxt',
  parcels: '/parcels',
  messages: '/messages',
  notifications: '/notifications',
};

export const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/transfers': 'Nouveau transfert',
  '/marketplace': 'Marketplace',
  '/feed': 'Fil d’actualité',
  '/moxt': 'MOXT',
  '/parcels': 'Colis',
  '/messages': 'Messagerie',
  '/notifications': 'Notifications',
  '/design-system': 'Design system',
};

export function titleForTabRoute(routeName: string): string {
  const path = TAB_ROUTE_PATHS[routeName];
  return (path && ROUTE_TITLES[path]) || 'MOXT';
}

function pathMatches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Portage de getMobileHeaderActions (moxt-react/src/components/layout/Header.jsx). */
export function getMobileHeaderActions(
  pathname: string,
  { canFeed, canNews, canParcels }: { canFeed: boolean; canNews: boolean; canParcels: boolean },
) {
  const isTransfers = pathMatches(pathname, '/transfers');
  const isParcels = pathMatches(pathname, '/parcels');
  const isNews = pathMatches(pathname, '/news');
  const isMarketplace = pathMatches(pathname, '/marketplace');
  const isFeed = pathMatches(pathname, '/feed') || pathname === '/videos';
  const showContextualShortcuts = !isTransfers && !isParcels && !isNews && !isMarketplace && !isFeed;
  return {
    showPublishMenu: !isFeed && !isTransfers,
    showNews: Boolean(canNews && !canFeed && showContextualShortcuts),
    showHistory: isTransfers,
    showParcels: Boolean(canParcels && !isFeed),
    showMessages: !isFeed,
  };
}
