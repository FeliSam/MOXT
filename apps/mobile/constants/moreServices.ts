import type { LucideIcon } from 'lucide-react-native';
import {
  Home,
  ArrowLeftRight,
  Repeat,
  Users,
  Building2,
  LayoutGrid,
  Package,
  ShoppingBag,
  Newspaper,
  Briefcase,
  CalendarDays,
  MessageSquare,
  Bell,
  Heart,
  FileText,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
  Gift,
  Layers,
  BookOpen,
  HelpCircle,
  Star,
  Shield,
} from 'lucide-react-native';

import { bottomNavigationPaths, moreServicesExcludedPaths } from '@moxt/shared';
import { selectUnreadMessageCount } from '@/store/messages';

export type MoreServiceItem = {
  id: string;
  label: string;
  path: string;
  mobileRoute: string;
  emoji: string;
  Icon: LucideIcon;
  badgeSelector?: 'messages' | 'notifications';
  roles?: string[];
  devModule?: string;
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
  '/moxt': '/(tabs)/moxt',
  '/transfers': '/transfer/wizard',
  '/p2p': '/p2p',
  '/exchangers': '/exchangers',
  '/exchanger': '/exchanger',
  '/stars': '/wallet',
  '/publications/mine': '/publications',
  '/businesses': '/organization',
  '/professional': '/professional',
  '/parcels': '/(tabs)/parcels',
  '/marketplace': '/(tabs)/marketplace',
  '/news': '/news',
  '/jobs': '/jobs',
  '/events': '/events',
  '/guide': '/guide',
  '/aide': '/aide',
  '/messages': '/messages',
  '/notifications': '/notifications',
  '/favorites': '/favorites',
  '/referral': '/referral',
  '/marketplace/mine': '/listing/mine',
  '/profile': '/profile',
  '/settings': '/settings',
  '/moderation': '/moderation',
  '/admin': '/admin',
  '/feature-matrix': '/feature-matrix',
  '/superadmin': '/superadmin',
};

function item(
  id: string,
  label: string,
  path: string,
  emoji: string,
  Icon: LucideIcon,
  extra?: Partial<MoreServiceItem>,
): MoreServiceItem {
  return {
    id,
    label,
    path,
    mobileRoute: WEB_TO_MOBILE[path] ?? path,
    emoji,
    Icon,
    ...extra,
  };
}

/** Groupes alignés sur moxt-react/src/config/navigation.js */
export const navigationGroups: MoreServiceGroup[] = [
  {
    id: 'home',
    label: 'Accueil',
    children: [
      item('moxt', 'MOXT', '/moxt', '💠', Layers),
      item('dashboard', 'Accueil', '/dashboard', '🏠', Home),
    ],
  },
  {
    id: 'finance',
    label: 'Finances',
    children: [
      item('transfers', 'Transfert', '/transfers', '💱', ArrowLeftRight),
      item('p2p', 'Echanges P2P', '/p2p', '🔄', Users),
      item('exchangers', 'Échangeurs', '/exchangers', '🤝', Repeat),
      item('stars', 'MOXT Stars', '/stars', '⭐', Star, { devModule: 'stars' }),
      item('exchanger-dashboard', 'Mon dashboard échangeur', '/exchanger', '📈', Repeat, {
        roles: ['professional', 'admin', 'superadmin'],
      }),
    ],
  },
  {
    id: 'services',
    label: 'Services',
    children: [
      item('businesses', 'Entreprises', '/businesses', '🏢', Building2),
      item('professional', 'Mon entreprise', '/professional', '💼', LayoutGrid),
      item('parcels', 'Colis', '/parcels', '📦', Package, { devModule: 'parcels' }),
      item('marketplace', 'Marketplace', '/marketplace', '🛍️', ShoppingBag),
    ],
  },
  {
    id: 'community',
    label: 'Communauté',
    children: [
      item('news', 'Actualités', '/news', '📰', Newspaper, { devModule: 'news' }),
      item('jobs', 'Jobs', '/jobs', '💼', Briefcase, { devModule: 'jobs' }),
      item('events', 'Evenements', '/events', '📅', CalendarDays, { devModule: 'events' }),
      item('guide', 'Guide', '/guide', '📖', BookOpen),
      item('product-help', 'Aide Moxt', '/aide', '❓', HelpCircle),
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    children: [
      item('messages', 'Messagerie', '/messages', '💬', MessageSquare, { badgeSelector: 'messages' }),
      item('notifications', 'Notifications', '/notifications', '🔔', Bell, { badgeSelector: 'notifications' }),
    ],
  },
  {
    id: 'account',
    label: 'Compte',
    children: [
      item('my-publications', 'Mes publications', '/publications/mine', '📋', FileText),
      item('favorites', 'Mes favoris', '/favorites', '❤️', Heart),
      item('referral', 'QR & invitation', '/referral', '🎁', Gift),
    ],
  },
  {
    id: 'moderation',
    label: 'Modération',
    roles: ['moderator', 'admin', 'superadmin'],
    children: [
      item('moderation', 'Espace modérateur', '/moderation', '🛡️', Shield, {
        roles: ['moderator', 'admin', 'superadmin'],
      }),
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    roles: ['admin', 'superadmin'],
    children: [
      item('admin', 'Centre de contrôle', '/admin', '⚙️', SlidersHorizontal, { roles: ['admin', 'superadmin'] }),
      item('feature-matrix', 'Couverture fonctionnelle', '/feature-matrix', '📊', BarChart3, {
        roles: ['admin', 'superadmin'],
      }),
      item('superadmin', 'Pilotage système', '/superadmin', '🛡️', ShieldCheck, { roles: ['superadmin'] }),
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
