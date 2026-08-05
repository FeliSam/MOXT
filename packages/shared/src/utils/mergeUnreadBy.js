/** Durée pendant laquelle un marquage lu local prime sur un compteur distant encore stale. */
export const READ_PENDING_MS = 60_000

/**
 * Fusionne les compteurs non lus — la source distante (Supabase) prime pour un 0 (lu ailleurs).
 * @param {Record<string, number>} [remote]
 * @param {Record<string, number>} [local]
 * @param {{ readPendingBy?: Record<string, number>, now?: number }} [options]
 * @returns {Record<string, number>}
 */
export function mergeUnreadBy(remote = {}, local = {}, options = {}) {
  const { readPendingBy = {}, now = Date.now() } = options
  const keys = new Set([...Object.keys(remote ?? {}), ...Object.keys(local ?? {})])
  const merged = {}
  for (const key of keys) {
    const hasRemote = Object.prototype.hasOwnProperty.call(remote ?? {}, key)
    const remoteCount = Number(remote?.[key]) || 0
    const localCount = Number(local?.[key]) || 0
    const pendingAt = Number(readPendingBy?.[key]) || 0
    const localReadPending =
      localCount === 0 &&
      remoteCount > 0 &&
      pendingAt > 0 &&
      now - pendingAt < READ_PENDING_MS

    if (hasRemote) {
      if (remoteCount === 0) {
        merged[key] = 0
      } else if (localReadPending) {
        merged[key] = 0
      } else {
        merged[key] = Math.max(remoteCount, localCount)
      }
    } else {
      merged[key] = localCount
    }
  }
  return merged
}
