/**
 * IndexedDB cache for public profile / business fiche previews (guest + returning visits).
 * Cache-first: paint from IDB, then revalidate via scoped network fetch.
 */

const DB_NAME = 'moxt-public-preview-idb-v1'
const BUSINESS_STORE = 'business'
const USER_STORE = 'user'
const META_STORE = 'meta'
const DB_VERSION = 1

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
      if (!db.objectStoreNames.contains(BUSINESS_STORE)) db.createObjectStore(BUSINESS_STORE)
      if (!db.objectStoreNames.contains(USER_STORE)) db.createObjectStore(USER_STORE)
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

async function readEntry(storeName, id) {
  if (!id) return null
  try {
    const db = await openDb()
    if (!db) return null
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const req = tx.objectStore(storeName).get(String(id))
      req.onsuccess = () => {
        const value = req.result
        resolve(value && typeof value === 'object' ? value : null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function writeEntry(storeName, id, payload) {
  if (!id || !payload || typeof payload !== 'object') return false
  try {
    const db = await openDb()
    if (!db) return false
    const tx = db.transaction([storeName, META_STORE], 'readwrite')
    tx.objectStore(storeName).put(
      { ...payload, cachedAt: new Date().toISOString() },
      String(id),
    )
    tx.objectStore(META_STORE).put(new Date().toISOString(), `${storeName}:${id}`)
    await txDone(tx)
    return true
  } catch {
    return false
  }
}

/** @returns {Promise<object|null>} */
export function readBusinessPreviewFromIdb(businessId) {
  return readEntry(BUSINESS_STORE, businessId)
}

/** @returns {Promise<object|null>} */
export function readUserPreviewFromIdb(userId) {
  return readEntry(USER_STORE, userId)
}

/** @param {string} businessId @param {object} preview */
export function writeBusinessPreviewToIdb(businessId, preview) {
  return writeEntry(BUSINESS_STORE, businessId, preview)
}

/** @param {string} userId @param {object} preview */
export function writeUserPreviewToIdb(userId, preview) {
  return writeEntry(USER_STORE, userId, preview)
}

export async function clearPublicPreviewIdb() {
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
