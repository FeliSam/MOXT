import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { isProfileVerified } from '../profile/userProfileUtils'
import { genderFromPreferences } from './coverBanners/coverBannerCatalog'

const BASE_COLUMNS = 'first_name, last_name, city, country, avatar_url, status, created_at, updated_at'

export function mapRemoteProfile(row) {
  if (!row) return null
  return {
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    city: row.city || '',
    country: row.country || '',
    avatarUrl: row.avatar_url || null,
    verified: row.status === 'verified',
    memberSince: row.created_at || row.updated_at || null,
    // Seuls le style de bannière et le genre sont repris des préférences du membre.
    coverStyle: row.preferences?.coverStyle || null,
    gender: genderFromPreferences(row.preferences),
  }
}

function fetchProfileRow(userId) {
  const query = (columns) => supabase.from('profiles').select(columns).eq('id', userId).maybeSingle()
  // Si la colonne preferences n'est pas lisible, on retombe sur les colonnes de base.
  return query(`${BASE_COLUMNS}, preferences`).then((result) =>
    result.error ? query(BASE_COLUMNS) : result,
  )
}

export function formatMemberSince(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function usePublicationProfile(userId, currentUser) {
  const isOwner = Boolean(userId && currentUser?.id === userId)
  const [remoteProfile, setRemoteProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(userId && !isOwner))

  useEffect(() => {
    if (!userId || isOwner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête réseau (fetch Supabase)
      setRemoteProfile(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    if (!supabase) {
      setLoading(false)
      return undefined
    }

    fetchProfileRow(userId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('[MOXT] Profil publication:', error.message)
          setRemoteProfile(null)
        } else {
          setRemoteProfile(mapRemoteProfile(data))
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser?.id, isOwner, userId])

  const profile = isOwner
    ? {
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        city: currentUser?.city || '',
        country: currentUser?.country || '',
        avatarUrl: currentUser?.avatarUrl || null,
        verified: isProfileVerified(currentUser),
        memberSince: currentUser?.createdAt || null,
      }
    : remoteProfile

  return { profile, loading, isOwner }
}
