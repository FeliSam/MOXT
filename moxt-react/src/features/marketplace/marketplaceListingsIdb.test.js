import { beforeEach, describe, expect, it, vi } from 'vitest'

/** In-memory IndexedDB stub — completes transactions after queued store ops. */
function installMemoryIdb() {
  const databases = new Map()

  class Req {
    result = null
    error = null
    onsuccess = null
    onerror = null
    onupgradeneeded = null
    onblocked = null
    _succeed(result) {
      this.result = result
      Promise.resolve().then(() => this.onsuccess?.(new Event('success')))
    }
  }

  class Store {
    constructor(map) {
      this.map = map
      this.pending = []
    }
    get(key) {
      const req = new Req()
      this.pending.push(
        Promise.resolve().then(() => {
          req.result = this.map.has(key) ? this.map.get(key) : undefined
          req.onsuccess?.(new Event('success'))
        }),
      )
      return req
    }
    put(value, key) {
      const req = new Req()
      this.pending.push(
        Promise.resolve().then(() => {
          this.map.set(key, value)
          req.onsuccess?.(new Event('success'))
        }),
      )
      return req
    }
    delete(key) {
      const req = new Req()
      this.pending.push(
        Promise.resolve().then(() => {
          this.map.delete(key)
          req.onsuccess?.(new Event('success'))
        }),
      )
      return req
    }
  }

  class Tx {
    constructor(db) {
      this.db = db
      this._stores = []
      this.oncomplete = null
      this.onerror = null
      this.onabort = null
      // Two ticks so callers can register put/get before complete.
      Promise.resolve()
        .then(() => Promise.resolve())
        .then(async () => {
          await Promise.all(this._stores.flatMap((s) => s.pending))
          this.oncomplete?.(new Event('complete'))
        })
    }
    objectStore(name) {
      if (!this.db.data.has(name)) this.db.data.set(name, new Map())
      const store = new Store(this.db.data.get(name))
      this._stores.push(store)
      return store
    }
  }

  class Db {
    constructor() {
      this.data = new Map()
      this.objectStoreNames = {
        names: new Set(),
        contains(n) {
          return this.names.has(n)
        },
      }
    }
    createObjectStore(name) {
      this.objectStoreNames.names.add(name)
      this.data.set(name, new Map())
    }
    transaction() {
      return new Tx(this)
    }
  }

  globalThis.indexedDB = {
    open(name, _version) {
      const req = new Req()
      Promise.resolve().then(() => {
        let db = databases.get(name)
        const upgrading = !db
        if (!db) {
          db = new Db()
          databases.set(name, db)
        }
        req.result = db
        if (upgrading) req.onupgradeneeded?.({ target: req })
        req.onsuccess?.(new Event('success'))
      })
      return req
    },
    deleteDatabase(name) {
      const req = new Req()
      Promise.resolve().then(() => {
        databases.delete(name)
        req.onsuccess?.(new Event('success'))
      })
      return req
    },
  }
}

describe('marketplaceListingsIdb', () => {
  beforeEach(() => {
    vi.resetModules()
    installMemoryIdb()
  })

  it('writes and reads listings (read-through cache)', async () => {
    const { writeListingsToIdb, readListingsFromIdb } = await import('./marketplaceListingsIdb.js')
    const listings = [{ id: 'ANN-1', title: 'Robe' }]
    expect(await writeListingsToIdb(listings)).toBe(true)
    expect(await readListingsFromIdb()).toEqual(listings)
  })

  it('upserts a published listing to the front', async () => {
    const { writeListingsToIdb, upsertListingInIdb, readListingsFromIdb } = await import(
      './marketplaceListingsIdb.js'
    )
    await writeListingsToIdb([
      { id: 'ANN-1', title: 'A' },
      { id: 'ANN-2', title: 'B' },
    ])
    await upsertListingInIdb({ id: 'ANN-3', title: 'New' })
    await upsertListingInIdb({ id: 'ANN-1', title: 'A2' })
    const items = await readListingsFromIdb()
    expect(items.map((i) => i.id)).toEqual(['ANN-1', 'ANN-3', 'ANN-2'])
    expect(items[0].title).toBe('A2')
  })

  it('invalidates cache on pull-to-refresh', async () => {
    const { writeListingsToIdb, invalidateListingsIdb, readListingsFromIdb } = await import(
      './marketplaceListingsIdb.js'
    )
    await writeListingsToIdb([{ id: 'ANN-1' }])
    await invalidateListingsIdb()
    expect(await readListingsFromIdb()).toEqual([])
  })
})
