import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { matchUserId } from './businessVisibility'

export function useBusinessActivityVisibility(business, currentUserId) {
  const businessId = business?.id
  const isOwner = Boolean(business && matchUserId(business.ownerId, currentUserId))
  const [remoteVisibility, setRemoteVisibility] = useState(null)
  const [loading, setLoading] = useState(Boolean(businessId && !isOwner))

  useEffect(() => {
    if (!businessId || isOwner) {
      setRemoteVisibility(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    if (!supabase) {
      setRemoteVisibility(business?.activityVisibility || 'public')
      setLoading(false)
      return undefined
    }

    supabase
      .from('businesses')
      .select('activity_visibility')
      .eq('id', businessId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('[MOXT] Visibilité entreprise:', error.message)
          setRemoteVisibility(business?.activityVisibility || 'public')
        } else {
          setRemoteVisibility(data?.activity_visibility || business?.activityVisibility || 'public')
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [business?.activityVisibility, businessId, isOwner])

  const visibility = isOwner
    ? business?.activityVisibility || 'public'
    : remoteVisibility || business?.activityVisibility || 'public'

  return { visibility, loading, isOwner }
}
