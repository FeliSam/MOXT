/**
 * Fusionne les compteurs non lus — la source distante (Supabase) prime pour un 0 (lu ailleurs).
 * @param {Record<string, number>} [remote]
 * @param {Record<string, number>} [local]
 * @returns {Record<string, number>}
 */
export function mergeUnreadBy(remote = {}, local = {}) {
  const keys = new Set([...Object.keys(remote ?? {}), ...Object.keys(local ?? {})])
  const merged = {}
  for (const key of keys) {
    const hasRemote = Object.prototype.hasOwnProperty.call(remote ?? {}, key)
    const remoteCount = Number(remote?.[key]) || 0
    const localCount = Number(local?.[key]) || 0
    if (hasRemote) {
      merged[key] = remoteCount === 0 ? 0 : Math.max(remoteCount, localCount)
    } else {
      merged[key] = localCount
    }
  }
  return merged
}
