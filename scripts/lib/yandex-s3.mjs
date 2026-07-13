import { createReadStream, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PutObjectCommand, S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { loadPhase2Env } from './env.mjs'
import { ycJson } from './yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const S3_ENDPOINT = 'https://storage.yandexcloud.net'
const S3_REGION = 'ru-central1'

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

export function contentTypeForKey(key) {
  const ext = path.extname(key).toLowerCase()
  return CONTENT_TYPES[ext] || 'application/octet-stream'
}

export function resolveS3Credentials() {
  const env = loadPhase2Env()
  const accessKeyId =
    process.env.MOXT_YC_S3_ACCESS_KEY_ID ||
    env.MOXT_YC_S3_ACCESS_KEY_ID ||
    process.env.YC_SNS_ACCESS_KEY_ID ||
    env.YC_SNS_ACCESS_KEY_ID
  const secretAccessKey =
    process.env.MOXT_YC_S3_SECRET_ACCESS_KEY ||
    env.MOXT_YC_S3_SECRET_ACCESS_KEY ||
    process.env.YC_SNS_SECRET_ACCESS_KEY ||
    env.YC_SNS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) return null
  return { accessKeyId, secretAccessKey }
}

export function readDeployServiceAccountId() {
  const inline =
    process.env.YC_SA_JSON ||
    (process.env.YC_SA_JSON_B64
      ? Buffer.from(process.env.YC_SA_JSON_B64, 'base64').toString('utf8')
      : '')

  if (inline) {
    try {
      const parsed = JSON.parse(inline)
      if (parsed?.service_account_id) return parsed.service_account_id
    } catch {
      // ignore
    }
  }

  const keyPath = path.join(root, 'scripts', 'github-deploy-sa.json')
  if (existsSync(keyPath)) {
    try {
      const parsed = JSON.parse(readFileSync(keyPath, 'utf8'))
      if (parsed?.service_account_id) return parsed.service_account_id
    } catch {
      // ignore
    }
  }

  return null
}

export function createEphemeralS3Credentials(serviceAccountId) {
  const key = ycJson('iam', 'access-key', 'create', '--service-account-id', serviceAccountId)
  if (!key?.access_key?.key_id || !key?.secret) {
    throw new Error('Impossible de créer une clé S3 statique pour le déploiement.')
  }
  return {
    accessKeyId: key.access_key.key_id,
    secretAccessKey: key.secret,
  }
}

export function ensureS3Credentials({ allowEphemeral = true } = {}) {
  const existing = resolveS3Credentials()
  if (existing) return { ...existing, source: 'env' }

  if (!allowEphemeral) return null

  const serviceAccountId = readDeployServiceAccountId()
  if (!serviceAccountId) return null

  const created = createEphemeralS3Credentials(serviceAccountId)
  process.env.MOXT_YC_S3_ACCESS_KEY_ID = created.accessKeyId
  process.env.MOXT_YC_S3_SECRET_ACCESS_KEY = created.secretAccessKey
  return { ...created, source: 'ephemeral' }
}

const PROBE_KEY = '.moxt-deploy-write-probe'

export async function validateS3WriteAccess(client, bucketName) {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: PROBE_KEY,
        Body: 'ok',
        ContentType: 'text/plain',
      }),
    )
    await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: PROBE_KEY }))
    return true
  } catch {
    return false
  }
}

export async function resolveWritableS3Client(bucketName, { forceYc = false } = {}) {
  if (forceYc) return { client: null, source: null, reason: 'forced-yc' }

  const envCreds = resolveS3Credentials()
  if (envCreds) {
    const client = createStorageS3Client(envCreds)
    if (await validateS3WriteAccess(client, bucketName)) {
      return { client, source: 'env', reason: null }
    }
  }

  const serviceAccountId = readDeployServiceAccountId()
  if (serviceAccountId) {
    try {
      const created = createEphemeralS3Credentials(serviceAccountId)
      const client = createStorageS3Client(created)
      if (await validateS3WriteAccess(client, bucketName)) {
        return { client, source: 'ephemeral', reason: envCreds ? 'env-readonly' : null }
      }
    } catch {
      // ignore — fallback yc CLI
    }
  }

  return {
    client: null,
    source: null,
    reason: envCreds ? 'env-readonly' : 'no-s3-credentials',
  }
}

export function createStorageS3Client(credentials) {
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  })
}

export async function uploadObjectS3(client, bucketName, { file, key }, { cacheControl }) {
  const upload = new Upload({
    client,
    queueSize: 4,
    partSize: 5 * 1024 * 1024,
    leavePartsOnError: false,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: createReadStream(file),
      CacheControl: cacheControl,
      ContentType: contentTypeForKey(key),
    },
  })
  await upload.done()
  return true
}

export async function runUploadBatchS3(
  client,
  bucketName,
  items,
  { concurrency = 32, cacheControlFn, onProgress } = {},
) {
  if (!items.length) return { uploaded: 0, failed: 0, failedKeys: [] }

  let uploaded = 0
  let failed = 0
  const failedKeys = []
  let index = 0
  let loggedErrors = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      const item = items[current]
      try {
        await uploadObjectS3(client, bucketName, item, {
          cacheControl: cacheControlFn(item.key),
        })
        uploaded += 1
      } catch (error) {
        failed += 1
        failedKeys.push(item.key)
        if (loggedErrors < 3) {
          loggedErrors += 1
          const message = error instanceof Error ? error.message : String(error)
          console.error(`  ✗ ${item.key} : ${message}`)
        }
      }
      onProgress?.({ uploaded, failed, total: items.length, key: item.key })
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return { uploaded, failed, failedKeys }
}

export async function listRemoteObjectsS3(client, bucketName) {
  const map = new Map()
  let continuationToken

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      }),
    )

    for (const object of page.Contents || []) {
      const etag = String(object.ETag || '').replace(/^"|"$/g, '')
      map.set(object.Key, { size: Number(object.Size), etag })
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)

  return map
}
