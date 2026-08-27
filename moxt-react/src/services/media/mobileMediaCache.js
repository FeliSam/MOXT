/**
 * Cache mobile Capacitor — métadonnées téléchargements / buffer vidéo (pas les blobs).
 * Fichiers sur disque via @capacitor/filesystem ; index SQLite local.
 */
import { isNative } from '../../platform/capacitor.js'

const DB_NAME = 'moxt_media_cache'
const DB_VERSION = 1
const TABLE = 'media_downloads'

let dbReady = null

async function loadSqlite() {
  const [{ CapacitorSQLite, SQLiteConnection }, { Capacitor }] = await Promise.all([
    import('@capacitor-community/sqlite'),
    import('@capacitor/core'),
  ])
  const connection = new SQLiteConnection(CapacitorSQLite)
  const platform = Capacitor.getPlatform()
  if (platform === 'web') {
    await connection.initWebStore()
  }
  return { connection, platform }
}

async function openDatabase() {
  if (!isNative) return null
  if (dbReady) return dbReady

  dbReady = (async () => {
    const { connection, platform } = await loadSqlite()
    let db = await connection.retrieveConnection(DB_NAME, false)
    if (!db) {
      db = await connection.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
    }
    await db.open()
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        media_id TEXT PRIMARY KEY,
        object_key TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'video',
        local_uri TEXT NOT NULL,
        byte_size INTEGER,
        mime_type TEXT,
        entity_type TEXT,
        entity_id TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER,
        last_access_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_media_downloads_expires ON ${TABLE}(expires_at);
      CREATE INDEX IF NOT EXISTS idx_media_downloads_entity ON ${TABLE}(entity_type, entity_id);
    `)
    return { db, platform }
  })()

  return dbReady
}

function rowFromResult(result) {
  const values = result?.values || []
  if (!values.length) return null
  const row = values[0]
  if (typeof row === 'object' && !Array.isArray(row)) return row
  const cols = result?.columns || []
  return Object.fromEntries(cols.map((c, i) => [c, row[i]]))
}

export const mobileMediaCache = {
  async isAvailable() {
    return isNative
  },

  async recordDownload({
    mediaId,
    objectKey,
    kind = 'video',
    localUri,
    byteSize,
    mimeType,
    entityType,
    entityId,
    expiresAt,
  }) {
    const ctx = await openDatabase()
    if (!ctx) return false
    const now = Date.now()
    await ctx.db.run(
      `INSERT OR REPLACE INTO ${TABLE}
        (media_id, object_key, kind, local_uri, byte_size, mime_type, entity_type, entity_id, cached_at, expires_at, last_access_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mediaId,
        objectKey,
        kind,
        localUri,
        byteSize ?? null,
        mimeType ?? null,
        entityType ?? null,
        entityId ?? null,
        now,
        expiresAt ?? null,
        now,
      ],
    )
    return true
  },

  async getByMediaId(mediaId) {
    const ctx = await openDatabase()
    if (!ctx) return null
    const result = await ctx.db.query(`SELECT * FROM ${TABLE} WHERE media_id = ? LIMIT 1`, [mediaId])
    return rowFromResult(result)
  },

  async touchAccess(mediaId) {
    const ctx = await openDatabase()
    if (!ctx) return
    await ctx.db.run(`UPDATE ${TABLE} SET last_access_at = ? WHERE media_id = ?`, [Date.now(), mediaId])
  },

  async listExpired(now = Date.now()) {
    const ctx = await openDatabase()
    if (!ctx) return []
    const result = await ctx.db.query(
      `SELECT * FROM ${TABLE} WHERE expires_at IS NOT NULL AND expires_at < ?`,
      [now],
    )
    return result?.values || []
  },

  async remove(mediaId) {
    const ctx = await openDatabase()
    if (!ctx) return
    await ctx.db.run(`DELETE FROM ${TABLE} WHERE media_id = ?`, [mediaId])
  },

  /** Écrit un blob sur disque Capacitor et enregistre les métadonnées. */
  async saveBlobToDisk({
    mediaId,
    objectKey,
    blob,
    kind = 'video',
    entityType,
    entityId,
    expiresAt,
    subdir = 'media-cache',
  }) {
    if (!isNative) return null
    const [{ Filesystem, Directory }, { Capacitor }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/core'),
    ])
    const ext = objectKey.split('.').pop() || 'bin'
    const fileName = `${mediaId}.${ext}`
    const base64 = await blobToBase64(blob)
    const written = await Filesystem.writeFile({
      path: `${subdir}/${fileName}`,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    })
    const localUri = written.uri || Capacitor.convertFileSrc(written.path || `${subdir}/${fileName}`)
    await this.recordDownload({
      mediaId,
      objectKey,
      kind,
      localUri,
      byteSize: blob.size,
      mimeType: blob.type,
      entityType,
      entityId,
      expiresAt,
    })
    return localUri
  },

  async purgeExpired() {
    const expired = await this.listExpired()
    if (!expired.length) return 0
    const { Filesystem } = await import('@capacitor/filesystem')
    let removed = 0
    for (const row of expired) {
      const mediaId = row.media_id || row[0]
      const localUri = row.local_uri || row[3]
      try {
        if (localUri) {
          await Filesystem.deleteFile({ path: localUri })
        }
      } catch {
        /* fichier déjà absent */
      }
      await this.remove(mediaId)
      removed += 1
    }
    return removed
  },
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      resolve(dataUrl.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function initMobileMediaCache() {
  if (!isNative) return
  try {
    await openDatabase()
    await mobileMediaCache.purgeExpired()
  } catch (error) {
    console.warn('[mobileMediaCache] init failed', error)
  }
}
