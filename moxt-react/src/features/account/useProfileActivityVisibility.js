import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountPreferences } from './accountSlice'
import { supabase } from '../../services/supabaseClient'

export function useProfileActivityVisibility(userId, currentUserId) {
  const ownPreferences = useSelector((state) =>
    userId && userId === currentUserId
      ? selectAccountPreferences(state, userId)
      : null,
  )
  const [remoteVisibility, setRemoteVisibility] = useState(null)
  const [loading, setLoading] = useState(Boolean(userId && userId !== currentUserId))

  useEffect(() => {
    if (!userId || userId === currentUserId) {
      setRemoteVisibility(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    if (!supabase) {
      setRemoteVisibility('private')
      setLoading(false)
      return undefined
    }

    supabase
      .from('profiles')
      .select('activity_visibility')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('[MOXT] Visibilité profil:', error.message)
          setRemoteVisibility('private')
        } else {
          setRemoteVisibility(data?.activity_visibility || 'private')
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUserId, userId])

  const visibility =
    userId === currentUserId
      ? ownPreferences?.activityVisibility || 'private'
      : remoteVisibility || 'private'

  return { visibility, loading }
}
