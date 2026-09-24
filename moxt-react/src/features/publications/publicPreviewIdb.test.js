import { beforeEach, describe, expect, it, vi } from 'vitest'

/** In-memory IndexedDB stub — mirrors marketplaceListingsIdb.test.js */
function installMemoryIdb() {
  const databases = new Map()

  class Req {
    result = null
    error = null
    onsuccess = null
    onerror = null
    onupgradeneeded = null
    onblocked = null
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
    open(name) {
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

describe('publicPreviewIdb', () => {
  beforeEach(() => {
    vi.resetModules()
    installMemoryIdb()
  })

  it('persists and reads a business preview', async () => {
    const { writeBusinessPreviewToIdb, readBusinessPreviewFromIdb } = await import(
      './publicPreviewIdb.js'
    )
    const preview = {
      business: { id: 'biz-1', name: 'Café' },
      publications: {
        listings: [{ id: 'L1' }],
        videos: [{ id: 'V1' }],
        parcels: [],
        jobs: [],
        events: [],
        posts: [],
        others: [],
      },
      reviews: [],
    }
    expect(await writeBusinessPreviewToIdb('biz-1', preview)).toBe(true)
    const read = await readBusinessPreviewFromIdb('biz-1')
    expect(read.business.name).toBe('Café')
    expect(read.publications.listings).toEqual([{ id: 'L1' }])
    expect(read.cachedAt).toBeTruthy()
  })

  it('persists and reads a user preview', async () => {
    const { writeUserPreviewToIdb, readUserPreviewFromIdb } = await import('./publicPreviewIdb.js')
    const preview = {
      profile: { id: 'u1', firstName: 'Ada' },
      publications: {
        listings: [],
        videos: [{ id: 'V9' }],
        parcels: [],
        jobs: [],
        events: [],
        posts: [],
        others: [],
      },
      business: null,
      reviews: [{ id: 'r1' }],
    }
    expect(await writeUserPreviewToIdb('u1', preview)).toBe(true)
    const read = await readUserPreviewFromIdb('u1')
    expect(read.profile.firstName).toBe('Ada')
    expect(read.publications.videos[0].id).toBe('V9')
  })
})
