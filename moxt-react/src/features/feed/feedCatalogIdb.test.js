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

describe('feedCatalogIdb', () => {
  beforeEach(() => {
    vi.resetModules()
    installMemoryIdb()
  })

  it('writes and reads videos', async () => {
    const { writeVideosToIdb, readVideosFromIdb } = await import('./feedCatalogIdb.js')
    const videos = [{ id: 'VID-1', title: 'Clip' }]
    expect(await writeVideosToIdb(videos)).toBe(true)
    expect(await readVideosFromIdb()).toEqual(videos)
  })

  it('writes and reads posts independently of videos', async () => {
    const {
      writeVideosToIdb,
      writePostsToIdb,
      readVideosFromIdb,
      readPostsFromIdb,
    } = await import('./feedCatalogIdb.js')
    await writeVideosToIdb([{ id: 'VID-1' }])
    await writePostsToIdb([{ id: 'POST-1', caption: 'Hi' }])
    expect(await readVideosFromIdb()).toEqual([{ id: 'VID-1' }])
    expect(await readPostsFromIdb()).toEqual([{ id: 'POST-1', caption: 'Hi' }])
  })

  it('invalidates both stores on pull-to-refresh', async () => {
    const {
      writeVideosToIdb,
      writePostsToIdb,
      invalidateFeedIdb,
      readVideosFromIdb,
      readPostsFromIdb,
    } = await import('./feedCatalogIdb.js')
    await writeVideosToIdb([{ id: 'VID-1' }])
    await writePostsToIdb([{ id: 'POST-1' }])
    await invalidateFeedIdb()
    expect(await readVideosFromIdb()).toEqual([])
    expect(await readPostsFromIdb()).toEqual([])
  })

  it('clearFeedIdb deletes the database', async () => {
    const { writeVideosToIdb, clearFeedIdb, readVideosFromIdb } = await import('./feedCatalogIdb.js')
    await writeVideosToIdb([{ id: 'VID-1' }])
    expect(await clearFeedIdb()).toBe(true)
    expect(await readVideosFromIdb()).toEqual([])
  })
})
