import { createHash } from 'node:crypto'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { ycRun } from './yandex.mjs'

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
  if (key === 'index.html' || key === 'sw.js' || key === 'offline.html') {
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

export function listRemoteObjects(bucketName) {
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

  return { files, toUpload, skipped }
}

export function uploadObject(bin, bucketName, { file, key }) {
  const { code } = ycRun(
    [
      'storage',
      's3',
      'cp',
      file,
      `s3://${bucketName}/${key}`,
      '--acl',
      'public-read',
      '--cache-control',
      uploadCacheControl(key),
    ],
    { inherit: true },
  )
  return code === 0
}

export async function syncDist(bin, bucketName, sourceDir, { full = false, dryRun = false } = {}) {
  const remoteObjects = full ? new Map() : listRemoteObjects(bucketName)
  const { files, toUpload, skipped } = await planDistUpload({
    sourceDir,
    remoteObjects,
    full,
  })

  return {
    total: files.length,
    skipped,
    toUpload,
    async runUpload() {
      if (dryRun) return { uploaded: 0, failed: 0 }

      let uploaded = 0
      let failed = 0
      for (const item of toUpload) {
        const ok = uploadObject(bin, bucketName, item)
        if (ok) uploaded += 1
        else failed += 1
      }
      return { uploaded, failed }
    },
  }
}
