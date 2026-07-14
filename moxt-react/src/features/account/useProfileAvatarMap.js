import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../services/supabaseClient'

/**
 * Charge en lot avatar_url / noms pour une liste d’ids profil.
 * Utile pour les stacks d’avatars sans N requêtes séparées côté UI.
 */
export function useProfileAvatarMap(userIds = []) {
  const currentUser = useSelector((state) => state.auth.user)
  const currentUserId = currentUser?.id
  const currentUserAvatar = currentUser?.avatarUrl || null
  const currentUserName =
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Moi'

  const idsKey = [...new Set((userIds || []).filter(Boolean))].sort().join(',')
  const [map, setMap] = useState({})

  useEffect(() => {
    const stableIds = idsKey ? idsKey.split(',') : []
    if (!stableIds.length) return undefined

    let cancelled = false
    const next = {}

    if (currentUserId && stableIds.includes(currentUserId)) {
      next[currentUserId] = {
        name: currentUserName,
        avatarUrl: currentUserAvatar,
      }
    }

    const remoteIds = stableIds.filter((id) => id !== currentUserId)
    if (!remoteIds.length || !supabase) {
      const frame = requestAnimationFrame(() => {
        if (!cancelled) setMap(next)
      })
      return () => {
        cancelled = true
        cancelAnimationFrame(frame)
      }
    }

    supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', remoteIds)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('[MOXT] Avatars abonnements:', error.message)
          setMap(next)
          return
        }
        for (const row of data || []) {
          next[row.id] = {
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Membre MOXT',
            avatarUrl: row.avatar_url || null,
          }
        }
        setMap({ ...next })
      })

    return () => {
      cancelled = true
    }
  }, [currentUserAvatar, currentUserId, currentUserName, idsKey])

  if (!idsKey) return {}
  return map
}
