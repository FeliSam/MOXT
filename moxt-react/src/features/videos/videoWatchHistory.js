const KEY = 'moxt-video-watch-v1'
const LIMIT = 50

function asIdList(value) {
  if (!Array.isArray(value)) return []
  return value.map((id) => String(id || '').trim()).filter(Boolean)
}

/** Most-recent-first video ids the current device has actually watched in the feed. */
export function readWatchedVideoIds(storage = globalThis.localStorage) {
  if (!storage) return []
  try {
    return asIdList(JSON.parse(storage.getItem(KEY) || '[]')).slice(0, LIMIT)
  } catch {
    return []
  }
}

export function rememberWatchedVideo(videoId, storage = globalThis.localStorage) {
  const id = String(videoId || '').trim()
  if (!id || !storage) return readWatchedVideoIds(storage)
  const next = [id, ...readWatchedVideoIds(storage).filter((row) => row !== id)].slice(0, LIMIT)
  try {
    storage.setItem(KEY, JSON.stringify(next))
  } catch {
    // quota / private mode
  }
  return next
}

export function watchedVideoIndex(videoId, ids = []) {
  const id = String(videoId || '').trim()
  if (!id) return -1
  return ids.indexOf(id)
}
