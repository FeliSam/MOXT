import { useEffect, useMemo, useState } from 'react';

import { fetchBusinessById } from '@moxt/shared/services/businessesService.js';
import { fetchPublicUserPublications } from '@moxt/shared/services/publicationsService.js';
import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';
import {
  REVIEW_TARGET_TYPES,
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js';

import { supabase } from '@/services/supabase';
import type { Business } from '@/store/account';
import { useAppSelector } from '@/store/store';

import {
  collectOwnerPublications,
  countActiveForKind,
  type PublicationBuckets,
  type PublisherKind,
} from './publisherCatalog';

const BUSINESS_VISIBLE = new Set(['verified', 'approved', 'active']);

const COPY: Record<
  PublisherKind,
  { countLabel: string; descriptionFallback: string; ctaLabel: string; resolveName: (entity: Record<string, unknown>) => string }
> = {
  listing: {
    countLabel: 'Annonces',
    descriptionFallback: 'Vendeur actif sur la Marketplace MOXT.',
    ctaLabel: 'Voir toutes les annonces',
    resolveName: (entity) => String(entity.sellerName || ''),
  },
  parcel: {
    countLabel: 'Voyages',
    descriptionFallback: 'Transporteur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => String(entity.ownerName || ''),
  },
  event: {
    countLabel: 'Événements',
    descriptionFallback: 'Organisateur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => String(entity.organizerName || ''),
  },
  job: {
    countLabel: 'Offres',
    descriptionFallback: 'Recruteur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => String(entity.publisherName || entity.company || ''),
  },
  p2p: {
    countLabel: 'Offres',
    descriptionFallback: 'Membre actif sur les échanges MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => String(entity.ownerName || ''),
  },
};

export type PublisherProfile = {
  business: Business | null;
  publisherName: string;
  verified: boolean;
  rating: { average: number; count: number };
  publicationCount: number;
  contactCount: number;
  shareCount: number;
  updatedAt?: string;
  description: string;
  ownerId?: string;
  publications: PublicationBuckets;
  publicationsPath: string | null;
  businessProfilePath: string | null;
  countLabel: string;
  ctaLabel: string;
};

function isReadyBusiness(business: { status?: string } | null | undefined) {
  return Boolean(business && BUSINESS_VISIBLE.has(String(business.status || '')));
}

/** Carte éditeur des fiches web (usePublisherDetailProfile). */
export function usePublisherDetailProfile(entity: Record<string, unknown> | null | undefined, kind: PublisherKind) {
  const listings = useAppSelector((state) => state.marketplace.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const jobs = useAppSelector((state) => state.dashboard.jobs);
  const events = useAppSelector((state) => state.dashboard.events);
  const offers = useAppSelector((state) => state.dashboard.p2pOffers);
  const businesses = useAppSelector((state) => state.account.businesses);
  const storedReviews = useAppSelector((state) => [
    ...state.account.reviewsReceived,
    ...state.account.reviewsAuthored,
    ...state.dashboard.reviews,
    ...state.dashboard.businessReviews,
  ]);
  const user = useAppSelector((state) => state.auth.user);
  const ownerId = entity?.ownerId ? String(entity.ownerId) : '';
  const businessId = entity?.businessId ? String(entity.businessId) : '';
  const [remotePublications, setRemotePublications] = useState<PublicationBuckets | null>(null);
  const [remoteBusiness, setRemoteBusiness] = useState<Business | null>(null);
  const [remoteReviews, setRemoteReviews] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!ownerId || !supabase) {
      setRemotePublications(null);
      return undefined;
    }
    let alive = true;
    fetchPublicUserPublications(supabase, ownerId)
      .then(
        (result) => {
          if (alive) setRemotePublications(result.publications as PublicationBuckets);
        },
        () => undefined,
      );
    void supabase
      .from('reviews')
      .select('*')
      .eq('target_id', ownerId)
      .limit(100)
      .then(({ data }) => {
        if (!alive || !Array.isArray(data)) return;
        setRemoteReviews(fromRows(data) as Record<string, unknown>[]);
      }, () => undefined);
    return () => {
      alive = false;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!businessId || !supabase) {
      setRemoteBusiness(null);
      return undefined;
    }
    const known = businesses.find((item) => item.id === businessId);
    if (known) {
      setRemoteBusiness(known);
      return undefined;
    }
    let alive = true;
    fetchBusinessById(supabase, businessId).then(
      (row) => {
        if (alive) setRemoteBusiness((row as Business) || null);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [businessId, businesses]);

  return useMemo(() => {
    if (!entity) return null;
    const meta = COPY[kind];
    const local = collectOwnerPublications(
      { listings, parcels, jobs, events, others: offers },
      ownerId,
    );
    const publications = remotePublications
      ? {
          ...remotePublications,
          others: remotePublications.others?.length ? remotePublications.others : local.others,
        }
      : local;
    const business =
      remoteBusiness ||
      businesses.find((item) => item.id === businessId) ||
      (!businessId && ownerId ? businesses.find((item) => item.ownerId === ownerId) || null : null);
    const resolvedBusinessId = businessId || business?.id || '';
    const selfName = ownerId && user?.id === ownerId ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : '';
    const publisherName =
      (business?.name && String(business.name).trim()) ||
      selfName ||
      meta.resolveName(entity) ||
      'Membre MOXT';
    const reviews = filterAggregateReviews([...storedReviews, ...remoteReviews], {
      profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: ownerId,
      publicationIds: collectPublicationTargetIds(publications),
    });
    const rating = calculateAggregateRating(reviews);
    return {
      business,
      publisherName,
      verified: business ? isReadyBusiness(business) : Boolean(entity.verified),
      rating: { average: rating.average, count: rating.count },
      publicationCount: countActiveForKind(publications, { ownerId, businessId: businessId || null }, kind),
      contactCount: Number(entity.contactCount || 0),
      shareCount: Number(entity.shareCount || 0),
      updatedAt: entity.updatedAt ? String(entity.updatedAt) : undefined,
      description: String(business?.description || entity.description || meta.descriptionFallback),
      ownerId: ownerId || undefined,
      publications,
      publicationsPath: ownerId
        ? kind === 'listing'
          ? `/users/${ownerId}/publications`
          : `/users/${ownerId}/publications?type=${kind === 'p2p' ? 'other' : kind}`
        : null,
      businessProfilePath: resolvedBusinessId ? `/organization/${resolvedBusinessId}` : null,
      countLabel: meta.countLabel,
      ctaLabel: meta.ctaLabel,
    } satisfies PublisherProfile;
  }, [
    businessId,
    businesses,
    entity,
    events,
    jobs,
    kind,
    listings,
    offers,
    ownerId,
    parcels,
    remoteBusiness,
    remotePublications,
    remoteReviews,
    storedReviews,
    user?.firstName,
    user?.id,
    user?.lastName,
  ]);
}
