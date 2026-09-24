import { useEffect, useState } from 'react'
import {
  fetchGuestBusinessPreview,
  fetchGuestListingDetail,
  fetchGuestMarketplaceListings,
  fetchGuestUserPreview,
} from './guestPreviewService'
import {
  applyScopedPublicationsToStore,
  emptyPublications,
  isPublicationsShrink,
  preferRicherPublications,
} from '../publications/publicPageCatalog'
import {
  readBusinessPreviewFromIdb,
  readUserPreviewFromIdb,
  writeBusinessPreviewToIdb,
  writeUserPreviewToIdb,
} from '../publications/publicPreviewIdb'

function toBusinessState(preview, { loading = false, error = null } = {}) {
  return {
    loading,
    error,
    business: preview?.business ?? null,
    publications: preview?.publications ?? null,
    reviews: preview?.reviews || [],
  }
}

function toUserState(preview, { loading = false, error = null } = {}) {
  return {
    loading,
    error,
    profile: preview?.profile ?? null,
    publications: preview?.publications ?? null,
    business: preview?.business ?? null,
    reviews: preview?.reviews || [],
  }
}

export function useGuestUserPreview(userId) {
  const [state, setState] = useState({
    loading: Boolean(userId),
    error: null,
    profile: null,
    publications: null,
    business: null,
    reviews: [],
  })

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (preview invité)
      setState({
        loading: false,
        error: 'not_found',
        profile: null,
        publications: null,
        business: null,
        reviews: [],
      })
      return undefined
    }

    let cancelled = false
    let cached = null

    setState((current) => ({
      ...current,
      loading: current.profile?.id === userId ? false : true,
      error: null,
    }))

    ;(async () => {
      cached = await readUserPreviewFromIdb(userId)
      if (cancelled) return
      if (cached?.profile) {
        // Cache-first: paint immediately, revalidate in background.
        setState(toUserState(cached, { loading: false, error: null }))
      }

      const result = await fetchGuestUserPreview(userId)
      if (cancelled) return

      if (result.error) {
        if (cached?.profile) {
          // Keep warm local preview — do not blank the page on network fail.
          setState(toUserState(cached, { loading: false, error: null }))
          return
        }
        setState({
          loading: false,
          error: result.error,
          profile: null,
          publications: null,
          business: null,
          reviews: [],
        })
        return
      }

      const mergedPublications = preferRicherPublications(
        cached?.publications,
        result.publications || emptyPublications(),
      )
      // Reject dramatic shrinks so a partial pull cannot wipe local grids.
      const publications = isPublicationsShrink(cached?.publications, result.publications)
        ? preferRicherPublications(result.publications, cached.publications)
        : mergedPublications

      const next = {
        profile: result.profile,
        publications,
        business: result.business ?? cached?.business ?? null,
        reviews: result.reviews?.length ? result.reviews : cached?.reviews || [],
      }
      setState(toUserState(next, { loading: false, error: null }))
      void writeUserPreviewToIdb(userId, next)
      try {
        const { store } = await import('../../app/store.js')
        applyScopedPublicationsToStore(store.dispatch, store.getState, publications)
      } catch {
        // store may be unavailable in isolated tests
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return state
}

export function useGuestMarketplaceListings(enabled = false) {
  const [state, setState] = useState({
    loading: enabled,
    listings: [],
  })

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (preview invité)
      setState({ loading: false, listings: [] })
      return undefined
    }

    let cancelled = false
    setState((current) => ({ ...current, loading: true }))

    fetchGuestMarketplaceListings().then((result) => {
      if (cancelled) return
      setState({
        loading: false,
        listings: result.listings || [],
      })
    })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}

export function useGuestListingDetail(listingId, enabled = false) {
  const [state, setState] = useState({
    loading: Boolean(enabled && listingId),
    error: null,
    listing: null,
  })

  useEffect(() => {
    if (!enabled || !listingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (preview invité)
      setState({ loading: false, error: null, listing: null })
      return undefined
    }

    let cancelled = false
    setState({ loading: true, error: null, listing: null })

    fetchGuestListingDetail(listingId).then((result) => {
      if (cancelled) return
      if (result.error) {
        setState({ loading: false, error: result.error, listing: null })
        return
      }
      setState({ loading: false, error: null, listing: result.listing })
    })

    return () => {
      cancelled = true
    }
  }, [enabled, listingId])

  return state
}

export function useGuestBusinessPreview(businessId) {
  const [state, setState] = useState({
    loading: Boolean(businessId),
    error: null,
    business: null,
    publications: null,
    reviews: [],
  })

  useEffect(() => {
    if (!businessId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (preview invité)
      setState({
        loading: false,
        error: 'not_found',
        business: null,
        publications: null,
        reviews: [],
      })
      return undefined
    }

    let cancelled = false
    let cached = null

    setState((current) => ({
      ...current,
      // Keep showing prior entity only if same id; otherwise soft-load until IDB/network.
      loading: current.business?.id === businessId ? false : true,
      error: null,
    }))

    ;(async () => {
      cached = await readBusinessPreviewFromIdb(businessId)
      if (cancelled) return
      if (cached?.business) {
        setState(toBusinessState(cached, { loading: false, error: null }))
      }

      const result = await fetchGuestBusinessPreview(businessId)
      if (cancelled) return

      if (result.error) {
        if (cached?.business) {
          setState(toBusinessState(cached, { loading: false, error: null }))
          return
        }
        setState({
          loading: false,
          error: result.error,
          business: null,
          publications: null,
          reviews: [],
        })
        return
      }

      const mergedPublications = preferRicherPublications(
        cached?.publications,
        result.publications || emptyPublications(),
      )
      const publications = isPublicationsShrink(cached?.publications, result.publications)
        ? preferRicherPublications(result.publications, cached.publications)
        : mergedPublications

      const next = {
        business: result.business,
        publications,
        reviews: result.reviews?.length ? result.reviews : cached?.reviews || [],
      }
      setState(toBusinessState(next, { loading: false, error: null }))
      void writeBusinessPreviewToIdb(businessId, next)
      // Best-effort: grow local marketplace/Fil catalogs for return visits.
      try {
        const { store } = await import('../../app/store.js')
        applyScopedPublicationsToStore(store.dispatch, store.getState, publications)
      } catch {
        // store may be unavailable in isolated tests
      }
    })()

    return () => {
      cancelled = true
    }
  }, [businessId])

  return state
}
