/**
 * Rewrite live content URL columns from Supabase Storage public URLs to CDN.
 */
import {
  legacyPathToObjectKey,
  yandexBucketForObjectKey,
} from '../../packages/shared/src/media/objectKeys.js'
import {
  parseSupabasePublicStorageUrl,
  rewriteUrlValue,
  supabasePublicUrlToCdnUrl,
} from './supabase-storage-url.mjs'

/** Tables / columns that commonly hold Fil / listings / avatar media URLs. */
export const REWRITE_TARGETS = [
  { table: 'videos', idColumn: 'id', columns: ['video_url', 'thumbnail_url'] },
  { table: 'listings', idColumn: 'id', columns: ['images'], jsonb: true },
  { table: 'profiles', idColumn: 'id', columns: ['avatar_url'] },
  { table: 'posts', idColumn: 'id', columns: ['image_url', 'images'], jsonbColumns: ['images'] },
  { table: 'statuses', idColumn: 'id', columns: ['images'], jsonb: true },
  { table: 'businesses', idColumn: 'id', columns: ['logo_url', 'banner_url'] },
  { table: 'media_objects', idColumn: 'id', columns: ['public_url', 'legacy_supabase_url'] },
]

function columnIsJsonb(target, column) {
  if (target.jsonb) return true
  return Array.isArray(target.jsonbColumns) && target.jsonbColumns.includes(column)
}

function rowMentionsSupabaseStorage(row, columns) {
  for (const col of columns) {
    const v = row[col]
    const text = typeof v === 'string' ? v : JSON.stringify(v || '')
    if (text.includes('/storage/v1/')) return true
  }
  return false
}

async function fetchRowsWithSupabaseUrls(admin, target, { limit }) {
  const selectCols = [target.idColumn, ...target.columns].join(',')
  const textCols = target.columns.filter((c) => !columnIsJsonb(target, c))
  const hasJsonb = target.columns.some((c) => columnIsJsonb(target, c))

  if (textCols.length && !hasJsonb) {
    let query = admin.from(target.table).select(selectCols).limit(limit)
    query = query.ilike(textCols[0], '%/storage/v1/%')
    const { data, error } = await query
    if (error) {
      const fallback = await admin.from(target.table).select(selectCols).limit(Math.max(limit, 500))
      if (fallback.error) throw new Error(`${target.table}: ${fallback.error.message}`)
      return (fallback.data || []).filter((row) => rowMentionsSupabaseStorage(row, target.columns))
    }
    return data || []
  }

  const scanLimit = Math.min(Math.max(limit * 10, limit), 2000)
  const { data, error } = await admin.from(target.table).select(selectCols).limit(scanLimit)
  if (error) throw new Error(`${target.table}: ${error.message}`)
  return (data || [])
    .filter((row) => rowMentionsSupabaseStorage(row, target.columns))
    .slice(0, limit)
}

function collectMappedObjectKeys(value) {
  const keys = []
  const visit = (v) => {
    if (typeof v === 'string') {
      const parsed = parseSupabasePublicStorageUrl(v)
      if (parsed) {
        try {
          const objectKey = legacyPathToObjectKey(parsed.bucket, parsed.objectPath)
          keys.push({
            objectKey,
            yandexBucket: yandexBucketForObjectKey(objectKey),
            legacyUrl: v,
          })
        } catch {
          // ignore
        }
      }
      return
    }
    if (Array.isArray(v)) v.forEach(visit)
    else if (v && typeof v === 'object') visit(v.url || v.publicUrl || v.src || v.path)
  }
  visit(value)
  return keys
}

/**
 * @param {object} opts
 * @param {import('@supabase/supabase-js').SupabaseClient} opts.admin
 * @param {string} opts.cdnBase
 * @param {string[]|null} opts.tables
 * @param {number} opts.limit
 * @param {boolean} opts.dryRun
 * @param {(info:{objectKey:string,yandexBucket:string,legacyUrl:string})=>Promise<boolean>} opts.shouldRewrite
 */
export async function rewriteLiveContentUrls({
  admin,
  cdnBase,
  tables = null,
  limit = 200,
  dryRun = false,
  shouldRewrite,
}) {
  const targets = REWRITE_TARGETS.filter((t) => !tables || tables.includes(t.table))
  let scanned = 0
  let updated = 0
  let skippedMissing = 0

  for (const target of targets) {
    console.log(`\n--- ${target.table} (${target.columns.join(', ')}) ---`)
    let rows
    try {
      rows = await fetchRowsWithSupabaseUrls(admin, target, { limit })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  skip table ${target.table}: ${msg}`)
      continue
    }
    console.log(`  ${rows.length} row(s) candidates`)

    for (const row of rows) {
      scanned += 1
      const patch = {}
      let rowChanged = false
      let rowSkippedMissing = false

      for (const col of target.columns) {
        const current = row[col]
        const mappedInfos = collectMappedObjectKeys(current)
        if (!mappedInfos.length) continue

        let allow = true
        for (const info of mappedInfos) {
          const ok = await shouldRewrite(info)
          if (!ok) {
            allow = false
            rowSkippedMissing = true
            console.log(
              `  skip ${target.table}.${row[target.idColumn]} ${col}: CDN/S3 missing for ${info.objectKey}`,
            )
            break
          }
        }
        if (!allow) continue

        const { next, changed } = rewriteUrlValue(current, cdnBase)
        if (changed) {
          patch[col] = next
          rowChanged = true
        }
      }

      if (rowSkippedMissing && !rowChanged) skippedMissing += 1
      if (!rowChanged) continue

      if (dryRun) {
        console.log(
          `  [dry-run] would update ${target.table} id=${row[target.idColumn]}`,
          Object.keys(patch),
        )
        updated += 1
        continue
      }

      const { error } = await admin
        .from(target.table)
        .update(patch)
        .eq(target.idColumn, row[target.idColumn])
      if (error) {
        console.error(`  ✗ ${target.table} id=${row[target.idColumn]}: ${error.message}`)
        continue
      }
      updated += 1
      console.log(`  ✓ ${target.table} id=${row[target.idColumn]} → ${Object.keys(patch).join(',')}`)
    }
  }

  return { scanned, updated, skippedMissing }
}

export { supabasePublicUrlToCdnUrl, parseSupabasePublicStorageUrl }
