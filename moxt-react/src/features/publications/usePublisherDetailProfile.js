import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { calculateBusinessRating } from '../businesses/businessSelectors'
import { isActiveListing } from '../marketplace/listingCatalogUtils'
import {
  collectUserPublications,
  isActiveEvent,
  isActiveJob,
  isActiveParcel,
} from './publicationCatalogUtils'

const PROFILE_META = {
  listing: {
    countLabel: 'Annonces',
    descriptionFallback: 'Vendeur actif sur la Marketplace MOXT.',
    ctaLabel: 'Voir toutes les annonces',
    resolveName: (entity) => entity?.sellerName,
    countItems: (publications, entity) =>
      publications.listings.filter(
        (item) => item.ownerId === entity?.ownerId && isActiveListing(item),
      ).length,
  },
  parcel: {
    countLabel: 'Voyages',
    descriptionFallback: 'Transporteur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => entity?.ownerName,
    countItems: (publications, entity) =>
      publications.parcels.filter(
        (item) =>
          item.ownerId === entity?.ownerId &&
          isActiveParcel(item) &&
          (entity?.businessId ? item.businessId === entity.businessId : !item.businessId),
      ).length,
  },
  event: {
    countLabel: 'Événements',
    descriptionFallback: 'Organisateur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => entity?.organizerName,
    countItems: (publications, entity) =>
      publications.events.filter(
        (item) =>
          item.ownerId === entity?.ownerId &&
          isActiveEvent(item) &&
          (entity?.businessId ? item.businessId === entity.businessId : !item.businessId),
      ).length,
  },
  job: {
    countLabel: 'Offres',
    descriptionFallback: 'Recruteur actif sur MOXT.',
    ctaLabel: 'Voir toutes les publications',
    resolveName: (entity) => entity?.publisherName,
    countItems: (publications, entity) =>
      publications.jobs.filter(
        (item) =>
          item.ownerId === entity?.ownerId &&
          isActiveJob(item) &&
          (entity?.businessId ? item.businessId === entity.businessId : !item.businessId),
      ).length,
  },
}

export function usePublisherDetailProfile(entity, kind) {
  const meta = PROFILE_META[kind]
  const ownerId = entity?.ownerId
  const businessId = entity?.businessId

  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.id === businessId),
  )
  const businessReviews = useSelector((state) =>
    state.reviews.items.filter(
      (item) =>
        item.targetType === 'business' &&
        item.targetId === businessId &&
        item.status === 'published',
    ),
  )
  const allReviews = useSelector((state) => state.reviews.items)
  const appState = useSelector((state) => state)

  const publications = useMemo(
    () => (ownerId ? collectUserPublications(appState, ownerId) : collectUserPublications(appState, '')),
    [appState, ownerId],
  )

  const publicationCount = useMemo(() => {
    if (!entity || !meta) return 0
    return meta.countItems(publications, entity)
  }, [entity, meta, publications])

  const rating = useMemo(() => {
    if (businessId) return calculateBusinessRating(businessReviews)
    if (!ownerId) return { average: 0, count: 0 }
    const aggregateReviews = filterAggregateReviews(allReviews, {
      profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: ownerId,
      publicationIds: collectPublicationTargetIds(publications),
    })
    return calculateAggregateRating(aggregateReviews)
  }, [allReviews, businessId, businessReviews, ownerId, publications])

  if (!entity || !meta) {
    return null
  }

  return {
    business,
    publisherName: meta.resolveName(entity) || 'Membre MOXT',
    publicationCount,
    rating,
    contactCount: Number(entity.contactCount || 0),
    shareCount: Number(entity.shareCount || 0),
    updatedAt: entity.updatedAt,
    ownerId,
    countLabel: meta.countLabel,
    descriptionFallback: meta.descriptionFallback,
    ctaLabel: meta.ctaLabel,
    publicationsPath: ownerId
      ? kind === 'listing'
        ? `/users/${ownerId}/publications`
        : `/users/${ownerId}/publications?type=${kind}`
      : null,
  }
}
