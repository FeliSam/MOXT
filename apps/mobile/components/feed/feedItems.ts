import { isActiveListing, isActiveParcel, isActiveVideo } from '@moxt/shared/domain/publicationRules.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';

export type FeedKind = 'video' | 'listing' | 'parcel' | 'job' | 'event' | 'post' | 'p2p';

export type FeedPublisher = {
  type: 'user' | 'business';
  id: string;
  name: string;
  avatarUrl: string;
  verified: boolean;
  ownerId?: string;
};

export type FeedItem = {
  id: string;
  kind: FeedKind;
  entityId: string;
  createdAt: string;
  publisher: FeedPublisher;
  title: string;
  caption: string;
  image: string;
  videoUrl: string;
  stats: { views: number; likes: number; comments: number; shares: number };
  isTrending?: boolean;
  route: string;
};

/** Filtres du web (feedItemUtils.FEED_TYPE_FILTERS) et libellés phase3I18n. */
export const FEED_TYPE_FILTERS: { id: 'all' | FeedKind; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'video', label: 'Vidéos' },
  { id: 'listing', label: 'Annonces' },
  { id: 'parcel', label: 'Colis' },
  { id: 'job', label: 'Jobs' },
  { id: 'event', label: 'Événements' },
  { id: 'post', label: 'Posts' },
  { id: 'p2p', label: 'P2P' },
];

type AnyRow = Record<string, any>;
type Businesses = Map<string, AnyRow>;

const VISIBLE_BUSINESS = ['verified', 'approved', 'active'];

function businessPublisher(business: AnyRow | undefined, fallbackName = ''): FeedPublisher {
  return {
    type: 'business',
    id: business?.id || '',
    name: business?.name || fallbackName || 'Entreprise MOXT',
    avatarUrl: business?.logoUrl || '',
    verified: VISIBLE_BUSINESS.includes(String(business?.status)),
    ownerId: business?.ownerId,
  };
}

function userPublisher(id: string, name: string, avatarUrl = '', verified = false): FeedPublisher {
  return { type: 'user', id: id || '', name: name || 'Membre MOXT', avatarUrl, verified };
}

const count = (v: unknown) => (Array.isArray(v) ? v.length : Number(v) || 0);

/** Engagement du web (feedRankUtils.feedEngagement). */
export function feedEngagement(item: FeedItem) {
  const s = item.stats;
  return s.views + s.likes * 4 + s.comments * 3 + s.shares * 3;
}

/**
 * Fil unifié simplifié : mêmes sources que le web (vidéos actives, annonces actives, colis,
 * événements publiés, posts publiés, offres P2P), vidéo la plus engageante en tête
 * (ensureLeadVideo), puis diversification par type (diversifyFeedItems, fenêtre 2).
 * Le classement personnalisé du web (feedRankUtils : historique, abonnements, sel) n'est pas repris.
 */
export function buildFeedItems(src: {
  videos: AnyRow[];
  listings: AnyRow[];
  parcels: AnyRow[];
  events: AnyRow[];
  posts: AnyRow[];
  p2pOffers: AnyRow[];
  businesses: AnyRow[];
  userId?: string;
}): FeedItem[] {
  const byId: Businesses = new Map(src.businesses.map((b) => [b.id, b]));
  const items: FeedItem[] = [];

  for (const v of src.videos) {
    if (!v?.id || !isActiveVideo(v)) continue;
    items.push({
      id: `video:${v.id}`,
      kind: 'video',
      entityId: v.id,
      createdAt: v.createdAt || '',
      publisher: businessPublisher(byId.get(v.businessId), v.businessName),
      title: v.title || '',
      caption: v.caption || '',
      image: v.thumbnailUrl || '',
      videoUrl: v.videoUrl || '',
      stats: { views: Number(v.viewCount) || 0, likes: count(v.likes), comments: count(v.comments), shares: Number(v.shareCount) || 0 },
      route: '/(tabs)/feed',
    });
  }
  for (const l of src.listings) {
    if (!l?.id || !isActiveListing(l)) continue;
    const price = l.price ? formatCurrency(l.price, l.currency || 'RUB') : '';
    items.push({
      id: `listing:${l.id}`,
      kind: 'listing',
      entityId: l.id,
      createdAt: l.createdAt || '',
      publisher: l.businessId ? businessPublisher(byId.get(l.businessId), l.sellerName) : userPublisher(l.ownerId, l.sellerName),
      title: l.title || '',
      caption: [price, l.city].filter(Boolean).join(' · '),
      image: (l.images || [])[0] || '',
      videoUrl: '',
      stats: { views: Number(l.views) || 0, likes: count(l.likes), comments: 0, shares: 0 },
      route: `/listing/${l.id}`,
    });
  }
  for (const p of src.parcels) {
    if (!p?.id || !isActiveParcel(p)) continue;
    items.push({
      id: `parcel:${p.id}`,
      kind: 'parcel',
      entityId: p.id,
      createdAt: p.createdAt || '',
      publisher: p.businessId ? businessPublisher(byId.get(p.businessId), p.ownerName) : userPublisher(p.ownerId, p.ownerName),
      title: [p.origin, p.destination].filter(Boolean).join(' → '),
      caption: p.remainingKg != null ? `${p.remainingKg} kg disponibles` : '',
      image: '',
      videoUrl: '',
      stats: { views: 0, likes: 0, comments: 0, shares: 0 },
      route: `/parcel/${p.id}`,
    });
  }
  for (const e of src.events) {
    if (!e?.id || e.status !== 'published') continue;
    items.push({
      id: `event:${e.id}`,
      kind: 'event',
      entityId: e.id,
      createdAt: e.createdAt || '',
      publisher: e.businessId ? businessPublisher(byId.get(e.businessId), e.organizerName) : userPublisher(e.ownerId, e.organizerName),
      title: e.title || '',
      caption: [e.city, e.format === 'online' ? 'En ligne' : null].filter(Boolean).join(' · '),
      image: e.coverUrl || e.imageUrl || (e.images || [])[0] || '',
      videoUrl: '',
      stats: { views: 0, likes: count(e.likes), comments: count(e.comments), shares: 0 },
      route: '/search',
    });
  }
  for (const p of src.posts) {
    if (!p?.id || (p.status && p.status !== 'published')) continue;
    items.push({
      id: `post:${p.id}`,
      kind: 'post',
      entityId: p.id,
      createdAt: p.createdAt || '',
      publisher: userPublisher(p.authorId, p.authorName, p.authorAvatarUrl || ''),
      title: p.title || '',
      caption: p.message || p.text || p.content || '',
      image: p.imageUrl || (p.images || [])[0] || '',
      videoUrl: '',
      stats: { views: 0, likes: count(p.likes), comments: count(p.comments), shares: 0 },
      route: '/(tabs)/feed',
    });
  }
  for (const o of src.p2pOffers) {
    if (!o?.id || o.status !== 'active') continue;
    items.push({
      id: `p2p:${o.id}`,
      kind: 'p2p',
      entityId: o.id,
      createdAt: o.createdAt || '',
      publisher: o.businessId ? businessPublisher(byId.get(o.businessId), o.ownerName) : userPublisher(o.ownerId, o.ownerName),
      title: `${formatCurrency(o.amount, o.fromCurrency)} vers ${o.toCurrency}`,
      caption: o.method || '',
      image: '',
      videoUrl: '',
      stats: { views: 0, likes: 0, comments: 0, shares: 0 },
      route: '/search',
    });
  }

  // Tendance : top 12 % d'engagement, seuil mini 6 (annotateTrendingItems).
  const engagements = items.map(feedEngagement).sort((a, b) => b - a);
  const slot = Math.max(0, Math.ceil(items.length * 0.12) - 1);
  const threshold = Math.max(6, engagements[slot] || 6);
  const annotated = items
    .map((item) => ({ ...item, isTrending: feedEngagement(item) >= threshold }))
    .sort((a, b) => feedEngagement(b) - feedEngagement(a) || b.createdAt.localeCompare(a.createdAt));

  const ordered: FeedItem[] = [];
  const remaining = [...annotated];
  while (remaining.length) {
    const recent = ordered.slice(-2);
    const kinds = new Set(recent.map((i) => i.kind));
    const pubs = new Set(recent.map((i) => i.publisher.id).filter(Boolean));
    const idx = remaining.findIndex((i) => !kinds.has(i.kind) || !pubs.has(i.publisher.id));
    ordered.push(remaining.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  const lead = ordered.find((i) => i.kind === 'video');
  return lead ? [lead, ...ordered.filter((i) => i !== lead)] : ordered;
}
