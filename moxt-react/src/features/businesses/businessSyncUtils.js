import { matchUserId } from './businessVisibility'

/**
 * Réconcilie le cache local avec les données Supabase.
 * Les entreprises du compte connecté viennent du serveur quand la sync réussit.
 * En cas d'erreur réseau/RLS, on conserve le cache local du compte pour éviter
 * de masquer une entreprise présente en base.
 */
export function reconcileBusinesses(
  localItems = [],
  remoteItems = [],
  ownerId,
  { preserveLocalOwnedOnRemoteError = false } = {},
) {
  if (!ownerId) return remoteItems || []

  const ownedRemoteIds = new Set(
    (remoteItems || [])
      .filter((item) => matchUserId(item.ownerId, ownerId))
      .map((item) => item.id),
  )

  const cleanedLocal = (localItems || []).filter((item) => {
    if (!matchUserId(item.ownerId, ownerId)) return false
    if (preserveLocalOwnedOnRemoteError) return true
    return ownedRemoteIds.has(item.id)
  })

  const merged = new Map(cleanedLocal.map((item) => [item.id, item]))
  for (const item of remoteItems || []) {
    if (item?.id) merged.set(item.id, { ...merged.get(item.id), ...item })
  }
  return [...merged.values()]
}

export function filterByBusinessIds(items = [], businessIds = []) {
  const ids = new Set(businessIds)
  if (!ids.size) return []
  return items.filter((item) => ids.has(item.businessId))
}
