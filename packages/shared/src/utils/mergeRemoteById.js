/** Fusionne des listes par `id` — les entrées distantes écrasent les locales. */
export function mergeRemoteById(localItems = [], remoteItems = []) {
  const merged = new Map()
  for (const item of localItems || []) {
    if (item?.id) merged.set(item.id, item)
  }
  for (const item of remoteItems || []) {
    if (item?.id) merged.set(item.id, { ...merged.get(item.id), ...item })
  }
  return [...merged.values()]
}

/**
 * Après un pull paginé (ex. 50 plus récents), retire les lignes locales
 * qui auraient dû être dans la fenêtre distante (archivées / supprimées
 * côté serveur, encore présentes dans le cache).
 */
export function pruneMissingInRemoteWindow(mergedItems = [], remoteItems = [], dateField = 'createdAt') {
  if (!remoteItems?.length) return mergedItems
  const remoteIds = new Set(remoteItems.map((item) => item?.id).filter(Boolean))
  let oldest = Infinity
  for (const item of remoteItems) {
    const time = new Date(item?.[dateField] || item?.createdAt || 0).getTime()
    if (Number.isFinite(time) && time < oldest) oldest = time
  }
  if (!Number.isFinite(oldest)) return mergedItems
  return (mergedItems || []).filter((item) => {
    if (!item?.id || remoteIds.has(item.id)) return true
    const time = new Date(item[dateField] || item.createdAt || 0).getTime()
    if (!Number.isFinite(time)) return true
    return time < oldest
  })
}

export function mergeRemoteByIdPruningWindow(localItems, remoteItems, dateField = 'createdAt') {
  return pruneMissingInRemoteWindow(mergeRemoteById(localItems, remoteItems), remoteItems, dateField)
}
