/**
 * Classement du marketplace, repris du web (features/marketplace/marketplaceFeed.js) :
 * « Pour vous », « Tendances », « Nouveautés », vidéos et grille « Découvrir ».
 * Simplifié : pas de boosts payants, d'impressions ni d'abonnements (non chargés sur le mobile).
 */
import type { ListingItem } from '@/store/marketplace';
import type { FeedVideo } from '@/store/feed';

const MS_HOUR = 60 * 60 * 1000;

export type FavoriteSignal = { id: string; type: string; addedAt?: string };

function hoursSince(iso: string | undefined, now: number) {
  const time = new Date(iso || 0).getTime();
  if (!Number.isFinite(time)) return 9999;
  return Math.max(0, (now - time) / MS_HOUR);
}

function listingEngagement(listing: ListingItem & { favorites?: unknown[]; contactCount?: number; shareCount?: number }) {
  return (
    Number(listing.views || 0) +
    Number(listing.favorites?.length || 0) * 4 +
    Number(listing.contactCount || 0) * 6 +
    Number(listing.shareCount || 0) * 3
  );
}

function affinityKey(listing: ListingItem) {
  return `${listing.type || 'other'}::${listing.category || ''}`;
}

type Ctx = {
  userId?: string;
  userCity?: string;
  favorites?: FavoriteSignal[];
  searching?: boolean;
  searchTerms?: string[];
  now?: number;
};

function buildAffinity(byId: Map<string, ListingItem>, favorites: FavoriteSignal[]) {
  const typeWeights: Record<string, number> = {};
  const categoryWeights: Record<string, number> = {};
  for (const fav of favorites) {
    if (fav.type !== 'listing') continue;
    const listing = byId.get(fav.id);
    if (listing?.type) typeWeights[listing.type] = (typeWeights[listing.type] || 0) + 3;
    if (listing?.category) categoryWeights[listing.category] = (categoryWeights[listing.category] || 0) + 3;
  }
  return { typeWeights, categoryWeights };
}

function scoreListing(
  listing: ListingItem,
  ctx: Ctx & { now: number; affinity: ReturnType<typeof buildAffinity> },
) {
  const hours = hoursSince(listing.createdAt, ctx.now);
  const userCity = (ctx.userCity || '').trim().toLowerCase();
  const listingCity = `${listing.city || ''}`.toLowerCase();
  let score = 0;
  score += Math.max(0, 72 - hours) * 0.35;
  score += Math.log10(1 + listingEngagement(listing)) * 14;
  score += Math.min((listing.images || []).filter(Boolean).length, 5) * 1.6;
  if (userCity && listingCity.includes(userCity)) score += 10;
  score += Number(ctx.affinity.typeWeights[listing.type || ''] || 0) * 2.2;
  score += Number(ctx.affinity.categoryWeights[listing.category || ''] || 0) * 3.4;
  if (listing.ownerId && listing.ownerId === ctx.userId) score -= 8;
  const haystack = `${listing.title || ''} ${listing.category || ''} ${listing.city || ''} ${listing.description || ''}`.toLowerCase();
  for (const term of ctx.searchTerms || []) {
    const needle = String(term || '').trim().toLowerCase();
    if (needle.length >= 2 && haystack.includes(needle)) score += 18;
  }
  for (const fav of ctx.favorites || []) {
    if (fav.type !== 'listing' || String(fav.id) !== String(listing.id)) continue;
    score += Math.max(0, 72 - hoursSince(fav.addedAt, ctx.now)) * 0.55;
  }
  return score;
}

function diversify(scored: { listing: ListingItem; score: number }[], windowSize = 2) {
  const remaining = [...scored];
  const ordered: { listing: ListingItem; score: number }[] = [];
  while (remaining.length) {
    const recentKeys = new Set(ordered.slice(-windowSize).map((item) => affinityKey(item.listing)));
    const pick = remaining.findIndex((item) => !recentKeys.has(affinityKey(item.listing)));
    ordered.push(remaining.splice(pick === -1 ? 0 : pick, 1)[0]);
  }
  return ordered.map((item) => item.listing);
}

function takeUnique(source: ListingItem[], limit: number, used: Set<string>) {
  const picked: ListingItem[] = [];
  for (const listing of source) {
    if (used.has(listing.id)) continue;
    picked.push(listing);
    used.add(listing.id);
    if (picked.length >= limit) break;
  }
  return picked;
}

function resolveRailSize(length: number, railSize: number) {
  if (length >= 18) return railSize;
  if (length >= 12) return Math.min(railSize, 6);
  return Math.min(railSize, Math.max(2, Math.floor(length / 3)));
}

export function buildMarketplaceDiscovery(listings: ListingItem[], ctx: Ctx = {}) {
  const now = ctx.now || Date.now();
  const list = Array.isArray(listings) ? listings : [];
  const railSize = resolveRailSize(list.length, 8);
  const affinity = buildAffinity(new Map(list.map((item) => [item.id, item])), ctx.favorites || []);
  const scored = list
    .map((listing) => ({ listing, score: scoreListing(listing, { ...ctx, now, affinity }) }))
    .sort((a, b) => b.score - a.score || String(a.listing.id).localeCompare(String(b.listing.id)));
  const ranked = scored.map((item) => item.listing);
  const showRails = list.length >= 6 && !ctx.searching;
  const used = new Set<string>();
  let forYou: ListingItem[] = [];
  let trending: ListingItem[] = [];
  let fresh: ListingItem[] = [];
  if (showRails) {
    forYou = takeUnique(ranked, railSize, used);
    trending = takeUnique(
      [...list].sort((a, b) => {
        const eng = listingEngagement(b) - listingEngagement(a);
        if (eng) return eng;
        return hoursSince(a.createdAt, now) - hoursSince(b.createdAt, now);
      }),
      railSize,
      used,
    );
    fresh = takeUnique(
      [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
      railSize,
      used,
    );
  }
  return { forYou, trending, fresh, discover: diversify(scored) };
}

/** Vidéos marketplace : likes, recherches, vues et récence (web rankMarketplaceVideos). */
export function rankMarketplaceVideos(videos: FeedVideo[], ctx: Ctx = {}) {
  const now = ctx.now || Date.now();
  const terms = (ctx.searchTerms || []).map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 2);
  return (videos || [])
    .filter((video) => video.status === 'active')
    .map((video) => {
      const likes = Array.isArray(video.likes) ? (video.likes as unknown[]).map(String) : [];
      let score = Math.max(0, 72 - hoursSince(video.createdAt, now)) * 0.4;
      score += Math.log10(1 + Number(video.viewCount || 0) + likes.length * 4) * 12;
      const haystack = `${video.title || ''} ${video.caption || ''} ${video.businessName || ''}`.toLowerCase();
      for (const term of terms) if (haystack.includes(term)) score += 18;
      if (ctx.userId && likes.includes(String(ctx.userId))) score += 20;
      return { video, score };
    })
    .sort((a, b) => b.score - a.score || String(b.video.id).localeCompare(String(a.video.id)))
    .map((row) => row.video)
    .slice(0, 12);
}
