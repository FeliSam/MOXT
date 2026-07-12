import { useEffect, useState } from 'react'
import { fetchGuestBusinessPreview, fetchGuestUserPreview } from './guestPreviewService'

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
