/**
 * Réconcilie le cache local avec les données Supabase.
 * Les entreprises du compte connecté viennent uniquement du serveur
 * (évite les fantômes créés hors ligne sur un autre appareil).
 */
export function reconcileBusinesses(localItems = [], remoteItems = [], ownerId) {
  if (!ownerId) return remoteItems

  const uid = String(ownerId)
  const ownedRemoteIds = new Set(
    remoteItems.filter((item) => String(item.ownerId) === uid).map((item) => item.id),
  )

  const cleanedLocal = (localItems || []).filter((item) => {
    if (String(item.ownerId) === uid) return ownedRemoteIds.has(item.id)
    return false
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
