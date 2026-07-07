import { bottomNavigationPaths, moreServicesExcludedPaths } from '@moxt/shared';
import { selectUnreadMessageCount } from '@/store/messages';

export type MoreServiceItem = {
  id: string;
  label: string;
  path: string;
  mobileRoute: string;
  emoji: string;
  badgeSelector?: 'messages' | 'notifications';
  roles?: string[];
};

export type MoreServiceGroup = {
  id: string;
  label: string;
  roles?: string[];
  children: MoreServiceItem[];
};

/** Chemins web → routes Expo */
const WEB_TO_MOBILE: Record<string, string> = {
  '/dashboard': '/(tabs)/index',
  '/transfers': '/transfer/wizard',
  '/p2p': '/search',
  '/exchangers': '/exchangers',
  '/businesses': '/organization',
  '/professional': '/organization',
  '/parcels': '/(tabs)/parcels',
  '/marketplace': '/(tabs)/marketplace',
  '/news': '/search',
  '/jobs': '/jobs',
  '/events': '/search',
  '/messages': '/messages',
  '/notifications': '/notifications',
  '/favorites': '/favorites',
  '/publications/mine': '/listing/mine',
  '/marketplace/mine': '/listing/mine',
  '/profile': '/profile/edit',
  '/admin': '/admin',
  '/feature-matrix': '/admin',
  '/superadmin': '/admin',
};

function item(
  id: string,
  label: string,
  path: string,
  emoji: string,
  extra?: Partial<MoreServiceItem>,
): MoreServiceItem {
  return {
    id,
    label,
    path,
    mobileRoute: WEB_TO_MOBILE[path] ?? path,
    emoji,
    ...extra,
  };
}

/** Groupes alignés sur moxt-react/src/config/navigation.js */
export const navigationGroups: MoreServiceGroup[] = [
  {
    id: 'home',
    label: 'Accueil',
    children: [item('dashboard', 'Accueil', '/dashboard', '🏠')],
  },
  {
    id: 'finance',
    label: 'Finances',
    children: [
      item('transfers', 'Transfert', '/transfers', '💱'),
      item('p2p', 'Echanges P2P', '/p2p', '🔄'),
      item('exchangers', 'Échangeurs', '/exchangers', '🤝'),
    ],
  },
  {
    id: 'services',
    label: 'Services',
    children: [
      item('businesses', 'Entreprises', '/businesses', '🏢'),
      item('professional', 'Espace professionnel', '/professional', '💼'),
      item('parcels', 'Colis', '/parcels', '📦'),
      item('marketplace', 'Marketplace', '/marketplace', '🛍️'),
    ],
  },
  {
    id: 'community',
    label: 'Communauté',
    children: [
      item('news', 'Actualités', '/news', '📰'),
      item('jobs', 'Jobs', '/jobs', '💼'),
      item('events', 'Evenements', '/events', '📅'),
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    children: [
      item('messages', 'Messagerie', '/messages', '💬', { badgeSelector: 'messages' }),
      item('notifications', 'Notifications', '/notifications', '🔔', { badgeSelector: 'notifications' }),
    ],
  },
  {
    id: 'account',
    label: 'Compte',
    children: [
      item('favorites', 'Mes favoris', '/favorites', '❤️'),
      item('my-publications', 'Mes publications', '/publications/mine', '📋'),
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    roles: ['admin', 'superadmin'],
    children: [
      item('admin', 'Centre de contrôle', '/admin', '⚙️', { roles: ['admin', 'superadmin'] }),
      item('feature-matrix', 'Couverture fonctionnelle', '/feature-matrix', '📊', {
        roles: ['admin', 'superadmin'],
      }),
      item('superadmin', 'Pilotage système', '/superadmin', '🛡️', { roles: ['superadmin'] }),
    ],
  },
];

function filterGroupItems(group: MoreServiceGroup, role: string | undefined, excludePaths: Set<string>) {
  return group.children.filter(
    (child) =>
      (!child.roles || (role && child.roles.includes(role))) &&
      !excludePaths.has(child.path),
  );
}

export function filterNavigationGroups(
  groups: MoreServiceGroup[],
  role: string | undefined,
  excludePaths: Set<string>,
  query: string,
  translateLabel: (label: string) => string,
): MoreServiceGroup[] {
  const q = query.trim().toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      children: filterGroupItems(group, role, excludePaths).filter(
        (child) => !q || translateLabel(child.label).toLowerCase().includes(q),
      ),
    }))
    .filter((group) => (!group.roles || (role && group.roles.includes(role))) && group.children.length > 0);
}

export function badgeForItem(
  item: MoreServiceItem,
  state: {
    auth: { user?: { id?: string } | null };
    notifications: { items: { read?: boolean }[] };
    messages: { conversations: Parameters<typeof selectUnreadMessageCount>[0] };
  },
): number {
  if (item.badgeSelector === 'notifications') {
    return state.notifications.items.filter((n) => !n.read).length;
  }
  if (item.badgeSelector === 'messages') {
    return selectUnreadMessageCount(state.messages.conversations, state.auth.user?.id);
  }
  return 0;
}

export { bottomNavigationPaths, moreServicesExcludedPaths };
