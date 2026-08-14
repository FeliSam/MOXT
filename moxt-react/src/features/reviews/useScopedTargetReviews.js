import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  REVIEW_TARGET_TYPES,
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js'
import { fetchReviewsForTargetScope } from './reviewRemote'
import { setAll } from './reviewSlice'

const PUBLICATION_KEY_ORDER = ['listing', 'parcel', 'job', 'event', 'post']

function stablePublicationKey(publicationIds) {
  return PUBLICATION_KEY_ORDER.map((type) => {
    const ids = publicationIds?.[type] || []
    return ids.length ? `${type}:${ids.slice().sort().join(',')}` : ''
  })
    .filter(Boolean)
    .join('|')
}

function useScopedTargetReviews({
  profileTargetType,
  profileTargetId,
  publications,
  ownerProfileId = null,
  enabled = true,
}) {
  const dispatch = useDispatch()
  const publicationIds = useMemo(
    () => collectPublicationTargetIds(publications || {}),
    [publications],
  )
  const publicationKey = useMemo(
    () => stablePublicationKey(publicationIds),
    [publicationIds],
  )
  const shouldFetch = Boolean(enabled && profileTargetType && profileTargetId)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!shouldFetch) return undefined

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (fetch avis ciblés)
    setLoading(true)

    fetchReviewsForTargetScope({
      profileTargetType,
      profileTargetId,
      publicationIds,
      ownerProfileId,
    })
      .then((reviews) => {
        if (cancelled) return
        setItems(reviews)
        if (reviews.length) dispatch(setAll({ items: reviews }))
      })
      .catch((error) => {
        console.warn('[MOXT] Avis cible:', error?.message || error)
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, shouldFetch, ownerProfileId, profileTargetId, profileTargetType, publicationIds, publicationKey])

  const reviews = useMemo(() => {
    if (!shouldFetch) return []
    return filterAggregateReviews(items, {
      profileTargetType,
      profileTargetId,
      publicationIds,
      ownerProfileId,
    })
  }, [shouldFetch, items, ownerProfileId, profileTargetId, profileTargetType, publicationIds])

  const rating = useMemo(() => calculateAggregateRating(reviews), [reviews])

  return { reviews, rating, loading: shouldFetch && loading }
}

export function useScopedProfileReviews(userId, publications, options = {}) {
  return useScopedTargetReviews({
    profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
    profileTargetId: userId,
    publications,
    ...options,
  })
}

export function useScopedBusinessReviews(businessId, content, options = {}) {
  const { ownerUserId, ...rest } = options
  const publications = useMemo(
    () => ({
      listings: content?.listings || [],
      parcels: content?.parcels || [],
      jobs: content?.jobs || [],
      events: content?.events || [],
      posts: content?.posts || [],
    }),
    [content],
  )

  return useScopedTargetReviews({
    profileTargetType: REVIEW_TARGET_TYPES.BUSINESS,
    profileTargetId: businessId,
    publications,
    ownerProfileId: ownerUserId || null,
    ...rest,
  })
}
