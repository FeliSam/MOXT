import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { recordListingImpression } from '../features/account/accountSlice'

export function useListingRailImpression(listingId, { enabled = true, railId = '' } = {}) {
  const dispatch = useDispatch()
  const userId = useSelector((state) => state.auth.user?.id)
  const ref = useRef(null)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
  }, [listingId, railId])

  useEffect(() => {
    if (!enabled || !listingId || !userId) return undefined
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return
        const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)
        if (!visible) return
        firedRef.current = true
        dispatch(
          recordListingImpression({
            userId,
            listingId,
            railId,
          }),
        )
      },
      { threshold: [0.55] },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, enabled, listingId, railId, userId])

  return ref
}
