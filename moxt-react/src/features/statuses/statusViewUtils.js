import { createLocalStorage } from '../../services/createLocalStorage'

const seenStorage = createLocalStorage('moxt-status-seen-v1')

function asId(value) {
  return value == null ? '' : String(value)
}

/** Normalise une liste viewedBy (ids string), sans doublons. */
export function normalizeViewedBy(list) {
  if (!Array.isArray(list)) return []
  return [...new Set(list.map(asId).filter(Boolean))]
}

export function statusHasBeenViewedBy(status, userId) {
  const uid = asId(userId)
  if (!uid || !status) return false
  return normalizeViewedBy(status.viewedBy || status.viewed_by).includes(uid)
}

/** Conserve la 1re date de vue quand on fusionne des maps viewers. */
export function mergeStatusViewers(remote = {}, local = {}) {
  const out = { ...(remote && typeof remote === 'object' ? remote : {}) }
  for (const [userId, entry] of Object.entries(local && typeof local === 'object' ? local : {})) {
    const existing = out[userId]
    if (!existing) {
      out[userId] = entry
      continue
    }
    const remoteAt = existing?.viewedAt ? new Date(existing.viewedAt).getTime() : NaN
    const localAt = entry?.viewedAt ? new Date(entry.viewedAt).getTime() : NaN
    const keepLocalFirst =
      Number.isFinite(localAt) && (!Number.isFinite(remoteAt) || localAt <= remoteAt)
    out[userId] = keepLocalFirst
      ? {
          ...existing,
          ...entry,
          viewedAt: entry.viewedAt || existing.viewedAt,
          name: entry.name || existing.name || '',
          avatarUrl: entry.avatarUrl ?? existing.avatarUrl ?? null,
        }
      : {
          ...entry,
          ...existing,
          viewedAt: existing.viewedAt || entry.viewedAt,
          name: existing.name || entry.name || '',
          avatarUrl: existing.avatarUrl ?? entry.avatarUrl ?? null,
        }
  }
  return out
}

export function mergeViewedByLists(...lists) {
  return normalizeViewedBy(lists.flatMap((list) => (Array.isArray(list) ? list : [])))
}

/**
 * Ledger local des ids déjà vus par utilisateur — filet si le reload
 * arrive avant la fin du RPC, ou si l'app se ferme immédiatement.
 */
export function readSeenStatusLedger(userId) {
  const uid = asId(userId)
  if (!uid) return new Set()
  const raw = seenStorage.read({})
  const list = Array.isArray(raw?.[uid]) ? raw[uid] : []
  return new Set(list.map(asId).filter(Boolean))
}

export function rememberSeenStatus(userId, statusId) {
  const uid = asId(userId)
  const sid = asId(statusId)
  if (!uid || !sid) return
  const raw = seenStorage.read({})
  const next = {
    ...(raw && typeof raw === 'object' ? raw : {}),
  }
  const current = normalizeViewedBy(next[uid])
  if (current.includes(sid)) return
  next[uid] = [...current, sid].slice(-400)
  seenStorage.write(next)
}

export function applySeenLedgerToStatuses(items, userId) {
  const seen = readSeenStatusLedger(userId)
  if (!seen.size) return items
  const uid = asId(userId)
  return (items || []).map((status) => {
    if (!status?.id || !seen.has(asId(status.id))) return status
    return {
      ...status,
      viewedBy: mergeViewedByLists(status.viewedBy, [uid]),
    }
  })
}
