import { createHash } from 'node:crypto'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  diffDeployManifests,
  manifestKeysToUpload,
  readDeployManifest,
} from './deploy-manifest.mjs'
import {
  listRemoteObjectsS3,
  runUploadBatchS3,
} from './yandex-s3.mjs'
import { ycRun } from './yandex.mjs'

const SHELL_KEYS = new Set([
  'index.html',
  'sw.js',
  'offline.html',
  'version.json',
  'deploy-manifest.json',
  'theme-init.js',
  'manifest.webmanifest',
])

export function walkFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walkFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

export function toObjectKey(sourceDir, file) {
  return path.relative(sourceDir, file).split(path.sep).join('/')
}

export function uploadCacheControl(key) {
  if (SHELL_KEYS.has(key)) {
    return 'no-cache, must-revalidate'
  }
  if (/^assets\/[^/]+-[A-Za-z0-9_-]+\.(js|css)$/.test(key)) {
    return 'public, max-age=31536000, immutable'
  }
  return 'public, max-age=3600'
}

function md5File(filePath) {
  const hash = createHash('md5')
  const data = createReadStream(filePath)
  return new Promise((resolve, reject) => {
    data.on('data', (chunk) => hash.update(chunk))
    data.on('error', reject)
    data.on('end', () => resolve(hash.digest('hex')))
  })
}

export function listRemoteObjectsYc(bucketName) {
  const map = new Map()
  let continuationToken = ''

  do {
    const args = ['storage', 's3api', 'list-objects-v2', '--bucket', bucketName, '--format', 'json']
    if (continuationToken) args.push('--continuation-token', continuationToken)

    const { code, stdout, stderr } = ycRun(args)
    if (code !== 0) {
      throw new Error(`list-objects-v2 → ${stderr || stdout}`)
    }

    const page = JSON.parse(stdout)
    for (const object of page.contents || []) {
      const etag = String(object.etag || '').replace(/^"|"$/g, '')
      map.set(object.key, { size: Number(object.size), etag })
    }

    continuationToken =
      page.is_truncated === true || page.is_truncated === 'true'
        ? page.next_continuation_token || ''
        : ''
  } while (continuationToken)

  return map
}

export async function listRemoteObjects(bucketName, { s3Client } = {}) {
  if (s3Client) {
    return listRemoteObjectsS3(s3Client, bucketName)
  }
  return listRemoteObjectsYc(bucketName)
}

function remoteMatchesLocal(remote, localSize, localEtag) {
  if (!remote) return false
  if (remote.size !== localSize) return false
  if (remote.etag && localEtag) return remote.etag === localEtag
  return true
}

export async function planDistUpload({ sourceDir, remoteObjects, full = false }) {
  const files = walkFiles(sourceDir)
  const toUpload = []
  let skipped = 0

  for (const file of files) {
    const key = toObjectKey(sourceDir, file)
    const { size } = statSync(file)

    if (full) {
      toUpload.push({ file, key, size })
      continue
    }

    const remote = remoteObjects.get(key)
    if (!remote) {
      toUpload.push({ file, key, size })
      continue
    }

    if (remote.size !== size) {
      toUpload.push({ file, key, size })
      continue
    }

    const localEtag = await md5File(file)
    if (remoteMatchesLocal(remote, size, localEtag)) {
      skipped += 1
      continue
    }

    toUpload.push({ file, key, size, localEtag })
  }

  return { files, toUpload, skipped, mode: 'remote-md5' }
}

export function planManifestUpload({ sourceDir, currentManifest, previousManifest, full = false }) {
  const keys = full ? Object.keys(currentManifest?.files || {}) : diffDeployManifests(previousManifest, currentManifest)
  const toUpload = manifestKeysToUpload(sourceDir, currentManifest, keys)
  const total = Object.keys(currentManifest?.files || {}).length
  const skipped = Math.max(0, total - toUpload.length)

  return {
    files: total,
    toUpload,
    skipped,
    mode: previousManifest && !full ? 'manifest-diff' : 'manifest-full',
  }
}

export async function runUploadBatch(
  bin,
  bucketName,
  items,
  { concurrency = 12, onProgress, transport = 'auto', s3Client } = {},
) {
  if (!items.length) return { uploaded: 0, failed: 0 }

  const useS3 = transport === 's3' || (transport === 'auto' && s3Client)

  if (useS3) {
    if (!s3Client) {
      throw new Error('Transport S3 demandé mais aucun client S3 inscriptible n’est disponible.')
    }
    return runUploadBatchS3(s3Client, bucketName, items, {
      concurrency: Math.max(concurrency, 16),
      cacheControlFn: uploadCacheControl,
      onProgress,
    })
  }

  let uploaded = 0
  let failed = 0
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      const item = items[current]
      const ok = uploadObjectYc(bin, bucketName, item, { quiet: true })
      if (ok) uploaded += 1
      else failed += 1
      onProgress?.({ uploaded, failed, total: items.length, key: item.key })
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return { uploaded, failed }
}

export function uploadObjectYc(bin, bucketName, { file, key }, { quiet = false } = {}) {
  const { code } = ycRun(
    [
      'storage',
      's3',
      'cp',
      file,
      `s3://${bucketName}/${key}`,
      '--cache-control',
      uploadCacheControl(key),
    ],
    { inherit: !quiet },
  )
  return code === 0
}

/** @deprecated alias */
export const uploadObject = uploadObjectYc

export async function runUploadBatchYc(bin, bucketName, items, { concurrency = 12, onProgress } = {}) {
  return runUploadBatch(bin, bucketName, items, {
    concurrency,
    onProgress,
    transport: 'yc',
  })
}

export function resolveUploadTransport({ forceYc = false, s3Client = null } = {}) {
  if (forceYc) return 'yc'
  if (s3Client) return 's3'
  return 'yc'
}

export async function syncDist(
  bin,
  bucketName,
  sourceDir,
  {
    full = false,
    dryRun = false,
    concurrency = 12,
    deployStatePath = '',
    distManifestPath = '',
    transport = 'auto',
    s3Client = null,
  } = {},
) {
  const manifestPath = distManifestPath || path.join(sourceDir, 'deploy-manifest.json')
  const currentManifest = readDeployManifest(manifestPath)
  const previousManifest = deployStatePath ? readDeployManifest(deployStatePath) : null

  let plan
  if (currentManifest && (previousManifest || full)) {
    plan = planManifestUpload({
      sourceDir,
      currentManifest,
      previousManifest,
      full: full || !previousManifest,
    })
  } else if (currentManifest && !full) {
    plan = planManifestUpload({ sourceDir, currentManifest, previousManifest: null, full: true })
  } else {
    const remoteObjects = full
      ? new Map()
      : await listRemoteObjects(bucketName, { s3Client: s3Client || undefined })
    plan = await planDistUpload({ sourceDir, remoteObjects, full })
  }

  const uploadTransport =
    transport === 'yc' ? 'yc' : transport === 's3' ? 's3' : s3Client ? 's3' : 'yc'

  return {
    total: plan.files,
    skipped: plan.skipped,
    toUpload: plan.toUpload,
    mode: plan.mode,
    transport: uploadTransport,
    currentManifest,
    async runUpload() {
      if (dryRun) return { uploaded: 0, failed: 0 }
      return runUploadBatch(bin, bucketName, plan.toUpload, {
        concurrency,
        transport: uploadTransport,
        s3Client,
      })
    },
  }
}
