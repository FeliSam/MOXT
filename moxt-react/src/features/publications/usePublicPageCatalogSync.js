import { useEffect } from 'react'
import { useDispatch, useStore } from 'react-redux'
import {
  fetchGuestBusinessPreview,
  fetchGuestUserPreview,
} from '../guest/guestPreviewService'
import {
  applyScopedPublicationsToStore,
  emptyPublications,
  isPublicationsShrink,
  preferRicherPublications,
} from './publicPageCatalog'
import {
  readBusinessPreviewFromIdb,
  readUserPreviewFromIdb,
  writeBusinessPreviewToIdb,
  writeUserPreviewToIdb,
} from './publicPreviewIdb'
import {
  collectBusinessPublications,
  collectUserPublications,
} from './publicationCatalogUtils'

/**
 * Authenticated public fiche / user publications: keep grids full on first paint
 * from Redux + IDB, then fill gaps with a scoped network pull (no global prune).
 */
export function usePublicBusinessCatalogSync(businessId, { enabled = true } = {}) {
  const dispatch = useDispatch()
  const store = useStore()

  useEffect(() => {
    if (!enabled || !businessId) return undefined
    let cancelled = false

    ;(async () => {
      const state = store.getState()
      const fromRedux = collectBusinessPublications(state, businessId)
      const cached = await readBusinessPreviewFromIdb(businessId)
      if (cancelled) return

      const localPublications = preferRicherPublications(
        cached?.publications,
        fromRedux || emptyPublications(),
      )

      // Seed Redux from IDB when local preview is richer than the global catalog.
      if (
        cached?.publications &&
        !isPublicationsShrink(cached.publications, fromRedux) &&
        (cached.publications.listings?.length || cached.publications.videos?.length)
      ) {
        applyScopedPublicationsToStore(dispatch, store.getState, cached.publications)
      }

      if (cached?.business && state.businesses?.items) {
        const exists = state.businesses.items.some((item) => item?.id === businessId)
        if (!exists) {
          const { setAll } = await import('../businesses/businessSlice.js')
          dispatch(
            setAll({
              items: [...(state.businesses.items || []), cached.business],
            }),
          )
        }
      }

      const result = await fetchGuestBusinessPreview(businessId)
      if (cancelled) return
      if (result.error || !result.business) return

      const remotePubs = result.publications || emptyPublications()
      const publications = isPublicationsShrink(localPublications, remotePubs)
        ? preferRicherPublications(remotePubs, localPublications)
        : preferRicherPublications(localPublications, remotePubs)

      applyScopedPublicationsToStore(dispatch, store.getState, publications)
      void writeBusinessPreviewToIdb(businessId, {
        business: result.business,
        publications,
        reviews: result.reviews || cached?.reviews || [],
      })
    })()

    return () => {
      cancelled = true
    }
  }, [businessId, dispatch, enabled, store])
}

export function usePublicUserCatalogSync(userId, { enabled = true } = {}) {
  const dispatch = useDispatch()
  const store = useStore()

  useEffect(() => {
    if (!enabled || !userId) return undefined
    let cancelled = false

    ;(async () => {
      const state = store.getState()
      const fromRedux = collectUserPublications(state, userId)
      const cached = await readUserPreviewFromIdb(userId)
      if (cancelled) return

      const localPublications = preferRicherPublications(
        cached?.publications,
        fromRedux || emptyPublications(),
      )

      if (
        cached?.publications &&
        (cached.publications.listings?.length ||
          cached.publications.videos?.length ||
          cached.publications.posts?.length)
      ) {
        applyScopedPublicationsToStore(dispatch, store.getState, cached.publications)
      }

      const result = await fetchGuestUserPreview(userId)
      if (cancelled) return
      if (result.error || !result.profile) return

      const remotePubs = result.publications || emptyPublications()
      const publications = isPublicationsShrink(localPublications, remotePubs)
        ? preferRicherPublications(remotePubs, localPublications)
        : preferRicherPublications(localPublications, remotePubs)

      applyScopedPublicationsToStore(dispatch, store.getState, publications)
      void writeUserPreviewToIdb(userId, {
        profile: result.profile,
        publications,
        business: result.business ?? cached?.business ?? null,
        reviews: result.reviews || cached?.reviews || [],
      })
    })()

    return () => {
      cancelled = true
    }
  }, [dispatch, enabled, store, userId])
}
