import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { useLanguage } from '../../contexts/useLanguage'
import { calculateBusinessRating } from '../businesses/businessSelectors'
import { isActiveListing } from '../marketplace/listingCatalogUtils'
import {
  collectUserPublications,
  isActiveEvent,
  isActiveJob,
  isActiveParcel,
} from './publicationCatalogUtils'
import { usePublicationProfile } from './usePublicationProfile'

const PROFILE_META = {
  listing: {
    countLabelKey: 'publications.publisher.stats.listings',
    descriptionFallbackKey: 'publications.publisher.fallbacks.listing',
    ctaLabelKey: 'publications.publisher.cta.listings',
    resolveName: (entity) => entity?.sellerName,
    countItems: (publications, entity) =>
      publications.listings.filter(
        (item) => item.ownerId === entity?.ownerId && isActiveListing(item),
      ).length,
  },
  parcel: {
    countLabelKey: 'publications.publisher.stats.trips',
    descriptionFallbackKey: 'publications.publisher.fallbacks.parcel',
    ctaLabelKey: 'publications.publisher.cta.publications',
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
    countLabelKey: 'publications.publisher.stats.events',
    descriptionFallbackKey: 'publications.publisher.fallbacks.event',
    ctaLabelKey: 'publications.publisher.cta.publications',
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
    countLabelKey: 'publications.publisher.stats.offers',
    descriptionFallbackKey: 'publications.publisher.fallbacks.job',
    ctaLabelKey: 'publications.publisher.cta.publications',
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
  const { t } = useLanguage()
  const meta = PROFILE_META[kind]
  const ownerId = entity?.ownerId
  const businessId = entity?.businessId

  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.id === businessId),
  )
  const ownerBusiness = useSelector((state) =>
    !businessId && ownerId
      ? state.businesses.items.find((item) => item.ownerId === ownerId)
      : null,
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
  const currentUser = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)
  const { profile: ownerProfile } = usePublicationProfile(ownerId, currentUser)

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
    ownerBusiness,
    publisherName: meta.resolveName(entity) || t('publications.publisher.memberMoxt'),
    publicationCount,
    rating,
    contactCount: Number(entity.contactCount || 0),
    shareCount: Number(entity.shareCount || 0),
    updatedAt: entity.updatedAt,
    ownerId,
    publications,
    countLabel: t(meta.countLabelKey),
    descriptionFallback: t(meta.descriptionFallbackKey),
    ctaLabel: t(meta.ctaLabelKey),
    publicationsPath: ownerId
      ? kind === 'listing'
        ? `/users/${ownerId}/publications`
        : `/users/${ownerId}/publications?type=${kind}`
      : null,
    verified: businessId
      ? ['verified', 'approved', 'active'].includes(business?.status)
      : Boolean(ownerProfile?.verified),
  }
}
