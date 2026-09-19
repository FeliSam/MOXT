/**
 * IndexedDB cache for Marketplace / Découvrir listings ("Postgres local").
 * Read-through: hydrate Redux from IDB first, then revalidate via loadAllData.
 * Not a real Postgres server — browser IDB only.
 */

const DB_NAME = 'moxt-marketplace-idb-v1'
const STORE = 'listings'
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
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
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

/** @returns {Promise<object[]>} */
export async function readListingsFromIdb() {
  try {
    const db = await openDb()
    if (!db) return []
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(ALL_KEY)
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

/** @param {object[]} listings */
export async function writeListingsToIdb(listings) {
  if (!Array.isArray(listings)) return false
  try {
    const db = await openDb()
    if (!db) return false
    const tx = db.transaction([STORE, META_STORE], 'readwrite')
    tx.objectStore(STORE).put(listings, ALL_KEY)
    tx.objectStore(META_STORE).put(new Date().toISOString(), META_UPDATED_AT)
    await txDone(tx)
    return true
  } catch {
    return false
  }
}

/** Upsert one listing into the cached array (publish success). */
export async function upsertListingInIdb(listing) {
  if (!listing?.id) return false
  try {
    const current = await readListingsFromIdb()
    const next = [listing, ...current.filter((item) => item?.id !== listing.id)]
    return writeListingsToIdb(next)
  } catch {
    return false
  }
}

/** Drop cache so the next network pull becomes source of truth (pull-to-refresh). */
export async function invalidateListingsIdb() {
  try {
    const db = await openDb()
    if (!db) return false
    const tx = db.transaction([STORE, META_STORE], 'readwrite')
    tx.objectStore(STORE).delete(ALL_KEY)
    tx.objectStore(META_STORE).delete(META_UPDATED_AT)
    await txDone(tx)
    return true
  } catch {
    return false
  }
}

export async function clearListingsIdb() {
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
