import { useEffect, useState } from 'react'
import {
  fetchGuestBusinessPreview,
  fetchGuestListingDetail,
  fetchGuestMarketplaceListings,
  fetchGuestUserPreview,
} from './guestPreviewService'
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
    setState((current) => ({ ...current, loading: true, error: null }))

    fetchGuestUserPreview(userId).then((result) => {
      if (cancelled) return
      if (result.error) {
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
      setState({
        loading: false,
        error: null,
        profile: result.profile,
        publications: result.publications,
        business: result.business,
        reviews: result.reviews || [],
      })
    })

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
    setState((current) => ({ ...current, loading: true, error: null }))

    fetchGuestBusinessPreview(businessId).then((result) => {
      if (cancelled) return
      if (result.error) {
        setState({
          loading: false,
          error: result.error,
          business: null,
          publications: null,
          reviews: [],
        })
        return
      }
      setState({
        loading: false,
        error: null,
        business: result.business,
        publications: result.publications,
        reviews: result.reviews || [],
      })
    })

    return () => {
      cancelled = true
    }
  }, [businessId])

  return state
}
