import {
  collectUserPublicationsFromCatalogs,
  emptyPublications,
  isActiveEvent,
  isActiveJob,
  isActiveListing,
  isActiveP2POffer,
  isActiveParcel,
} from '@moxt/shared/domain/publicationRules.js';

export type PublisherKind = 'listing' | 'parcel' | 'job' | 'event' | 'p2p';

export type PublicationBuckets = {
  listings: Record<string, unknown>[];
  parcels: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  events: Record<string, unknown>[];
  videos: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  others: Record<string, unknown>[];
};

export type StripItem = {
  id: string;
  kind: 'listing' | 'job' | 'event' | 'parcel' | 'p2p';
  title: string;
  meta: string;
  image: string | null;
  path: string;
};

const KIND_PATH: Record<StripItem['kind'], (id: string) => string> = {
  listing: (id) => `/listing/${id}`,
  job: (id) => `/jobs/${id}`,
  event: (id) => `/events/${id}`,
  parcel: (id) => `/parcel/${id}`,
  p2p: (id) => `/p2p/${id}`,
};

export function imageUrl(item: Record<string, unknown> | null | undefined): string | null {
  if (!item) return null;
  const images = item.images;
  const first = Array.isArray(images) ? images[0] : null;
  if (typeof first === 'string' && first) return first;
  if (first && typeof first === 'object' && 'url' in first && first.url) return String(first.url);
  if (typeof item.image === 'string' && item.image) return item.image;
  if (typeof item.coverImage === 'string' && item.coverImage) return item.coverImage;
  return null;
}

export function imageList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'url' in item && item.url) return String(item.url);
      return '';
    })
    .filter(Boolean);
}

export function collectOwnerPublications(
  catalogs: {
    listings?: unknown[];
    parcels?: unknown[];
    jobs?: unknown[];
    events?: unknown[];
    videos?: unknown[];
    posts?: unknown[];
    others?: unknown[];
  },
  ownerId?: string | null,
): PublicationBuckets {
  if (!ownerId) return emptyPublications() as PublicationBuckets;
  return collectUserPublicationsFromCatalogs(catalogs, ownerId) as PublicationBuckets;
}

function asRecord(item: unknown): Record<string, unknown> {
  return item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
}

/**
 * Autres publications actives du même auteur (annonces, jobs, événements, colis, offres P2P).
 * Même filtre que PublisherPublicationsStrip du web, plus les offres P2P.
 */
export function buildPublisherStripItems(
  publications: PublicationBuckets | null | undefined,
  currentId?: string,
  limit = 8,
): StripItem[] {
  if (!publications) return [];
  const items: StripItem[] = [
    ...(publications.listings || [])
      .filter((item) => isActiveListing(item) && asRecord(item).id !== currentId)
      .map((item) => {
        const row = asRecord(item);
        return {
          id: String(row.id),
          kind: 'listing' as const,
          title: String(row.title || 'Annonce'),
          meta: String(row.city || row.category || ''),
          image: imageUrl(row),
          path: KIND_PATH.listing(String(row.id)),
        };
      }),
    ...(publications.jobs || [])
      .filter((item) => isActiveJob(item) && asRecord(item).id !== currentId)
      .map((item) => {
        const row = asRecord(item);
        return {
          id: String(row.id),
          kind: 'job' as const,
          title: String(row.title || 'Offre'),
          meta: String(row.location || row.city || row.sector || ''),
          image: imageUrl(row),
          path: KIND_PATH.job(String(row.id)),
        };
      }),
    ...(publications.events || [])
      .filter((item) => isActiveEvent(item) && asRecord(item).id !== currentId)
      .map((item) => {
        const row = asRecord(item);
        return {
          id: String(row.id),
          kind: 'event' as const,
          title: String(row.title || 'Événement'),
          meta: String(row.city || ''),
          image: imageUrl(row),
          path: KIND_PATH.event(String(row.id)),
        };
      }),
    ...(publications.parcels || [])
      .filter((item) => isActiveParcel(item) && asRecord(item).id !== currentId)
      .map((item) => {
        const row = asRecord(item);
        return {
          id: String(row.id),
          kind: 'parcel' as const,
          title: `${row.origin || '—'} → ${row.destination || '—'}`,
          meta: String(row.departureDate || ''),
          image: imageUrl(row),
          path: KIND_PATH.parcel(String(row.id)),
        };
      }),
    ...(publications.others || [])
      .filter((item) => isActiveP2POffer(item) && asRecord(item).id !== currentId)
      .map((item) => {
        const row = asRecord(item);
        return {
          id: String(row.id),
          kind: 'p2p' as const,
          title: `${row.amount ?? ''} ${row.fromCurrency || ''} → ${row.toCurrency || ''}`.trim(),
          meta: String(row.method || ''),
          image: null,
          path: KIND_PATH.p2p(String(row.id)),
        };
      }),
  ];
  return items.slice(0, limit);
}

export function countActiveForKind(
  publications: PublicationBuckets,
  entity: { ownerId?: string; businessId?: string | null },
  kind: PublisherKind,
): number {
  if (kind === 'listing') {
    return publications.listings.filter((item) => item.ownerId === entity.ownerId && isActiveListing(item)).length;
  }
  if (kind === 'parcel') {
    return publications.parcels.filter(
      (item) =>
        item.ownerId === entity.ownerId &&
        isActiveParcel(item) &&
        (entity.businessId ? item.businessId === entity.businessId : !item.businessId),
    ).length;
  }
  if (kind === 'event') {
    return publications.events.filter(
      (item) =>
        item.ownerId === entity.ownerId &&
        isActiveEvent(item) &&
        (entity.businessId ? item.businessId === entity.businessId : !item.businessId),
    ).length;
  }
  if (kind === 'job') {
    return publications.jobs.filter(
      (item) =>
        item.ownerId === entity.ownerId &&
        isActiveJob(item) &&
        (entity.businessId ? item.businessId === entity.businessId : !item.businessId),
    ).length;
  }
  return publications.others.filter((item) => item.ownerId === entity.ownerId && isActiveP2POffer(item)).length;
}

export const STRIP_KIND_LABEL: Record<StripItem['kind'], string> = {
  listing: 'Annonce',
  job: 'Job',
  event: 'Événement',
  parcel: 'Colis',
  p2p: 'P2P',
};
