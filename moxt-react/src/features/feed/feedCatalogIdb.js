/**
 * IndexedDB cache for Fil feed catalogs (videos + posts).
 * Read-through: hydrate Redux from IDB first, then revalidate via loadAllData / catalogSync.
 * Complements localStorage keys moxt-videos-v1 / moxt-posts-v1 for larger catalogs.
 */

const DB_NAME = 'moxt-feed-idb-v1'
const VIDEOS_STORE = 'videos'
const POSTS_STORE = 'posts'
const META_STORE = 'meta'
const DB_VERSION = 1
const ALL_KEY = 'all'
const META_UPDATED_AT = 'updatedAt'

function canUseIdb() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openDb() {
  if (!canUseIdb()) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error || new Error('idb_open_failed'))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) db.createObjectStore(VIDEOS_STORE)
      if (!db.objectStoreNames.contains(POSTS_STORE)) db.createObjectStore(POSTS_STORE)
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE)
    }
    req.onsuccess = () => resolve(req.result)
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('idb_tx_failed'))
    tx.onabort = () => reject(tx.error || new Error('idb_tx_aborted'))
  })
}

async function readStore(storeName) {
  try {
    const db = await openDb()
    if (!db) return []
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const req = tx.objectStore(storeName).get(ALL_KEY)
      req.onsuccess = () => {
        const value = req.result
        resolve(Array.isArray(value) ? value : [])
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

async function writeStore(storeName, items) {
  if (!Array.isArray(items)) return false
  try {
    const db = await openDb()
    if (!db) return false
    const tx = db.transaction([storeName, META_STORE], 'readwrite')
    tx.objectStore(storeName).put(items, ALL_KEY)
    tx.objectStore(META_STORE).put(new Date().toISOString(), META_UPDATED_AT)
    await txDone(tx)
    return true
  } catch {
    return false
  }
}

/** @returns {Promise<object[]>} */
export function readVideosFromIdb() {
  return readStore(VIDEOS_STORE)
}

/** @returns {Promise<object[]>} */
export function readPostsFromIdb() {
  return readStore(POSTS_STORE)
}

/** @param {object[]} videos */
export function writeVideosToIdb(videos) {
  return writeStore(VIDEOS_STORE, videos)
}

/** @param {object[]} posts */
export function writePostsToIdb(posts) {
  return writeStore(POSTS_STORE, posts)
}

/** Drop feed caches so the next network pull becomes source of truth (pull-to-refresh). */
export async function invalidateFeedIdb() {
  try {
    const db = await openDb()
    if (!db) return false
    const tx = db.transaction([VIDEOS_STORE, POSTS_STORE, META_STORE], 'readwrite')
    tx.objectStore(VIDEOS_STORE).delete(ALL_KEY)
    tx.objectStore(POSTS_STORE).delete(ALL_KEY)
    tx.objectStore(META_STORE).delete(META_UPDATED_AT)
    await txDone(tx)
    return true
  } catch {
    return false
  }
}

export async function clearFeedIdb() {
  if (!canUseIdb()) return false
  try {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
    return true
  } catch {
    return false
  }
}
