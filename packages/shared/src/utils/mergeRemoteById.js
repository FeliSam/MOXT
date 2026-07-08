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
