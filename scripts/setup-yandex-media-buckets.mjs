#!/usr/bin/env node
/**
 * Provisionne les buckets média MOXT sur Yandex Object Storage.
 *
 * Usage:
 *   node scripts/setup-yandex-media-buckets.mjs
 *   node scripts/setup-yandex-media-buckets.mjs --public-bucket=moxt-public --private-bucket=moxt-private
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import {
  createStorageS3Client,
  ensureS3Credentials,
  validateS3WriteAccess,
} from './lib/yandex-s3.mjs'
import { ycJson, ycRun } from './lib/yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_BUCKET = process.env.MOXT_MEDIA_PUBLIC_BUCKET || 'moxt-public'
const PRIVATE_BUCKET = process.env.MOXT_MEDIA_PRIVATE_BUCKET || 'moxt-private'

function parseArgs(argv) {
  const out = {}
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    if (eq < 0) out[arg.slice(2)] = true
    else out[arg.slice(2, eq)] = arg.slice(eq + 1)
  }
  return out
}

function ensureBucket(name, { publicRead = false } = {}) {
  const list = ycJson('storage', 'bucket', 'list')
  const buckets = list?.buckets || list || []
  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === name || b === name)
  if (!exists) {
    console.log(`→ Création bucket ${name}…`)
    ycJson('storage', 'bucket', 'create', '--name', name)
  } else {
    console.log(`✓ Bucket ${name} existe`)
  }

  if (publicRead) {
    const saIds = [
      process.env.MOXT_YC_DEPLOY_SA_ID || 'ajeg2cc4j404o6m6krrt',
      process.env.MOXT_YC_AUTH_SA_ID || 'ajeea2k4t12t641ibgvf',
    ]
    const grantArgs = saIds.flatMap((id) => [
      '--grants',
      `grant-type=grant-type-account,grantee-id=${id},permission=permission-full-control`,
    ])
    const policyPath = path.join(root, 'scripts', 'lib', 'moxt-public-bucket-policy.json')
    let policyTemplate = readFileSync(policyPath, 'utf8')
    policyTemplate = policyTemplate.replaceAll('moxt-public', name)
    const policyFile = path.join(root, 'scripts', 'lib', `.${name}-policy.generated.json`)
    writeFileSync(policyFile, policyTemplate)
    const { code, stderr } = ycRun([
      'storage',
      'bucket',
      'update',
      name,
      '--public-read',
      ...grantArgs,
      '--policy-from-file',
      policyFile,
    ])
    if (code !== 0) {
      console.warn(`  ⚠ public-read / policy : ${stderr.trim()}`)
    }
  }
}

function printLifecycleHint() {
  console.log(`
Lifecycle (à configurer dans console Yandex ou via API) :
  - public/videos/status/  → expiration 24h
  - private/*/temp/        → expiration 7j

CDN média :
  - Créer ressource CDN cdn.moxtapp.ru → origine ${PUBLIC_BUCKET}
  - Voir docs/yandex-media-storage-setup.md
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const publicBucket = args['public-bucket'] || PUBLIC_BUCKET
  const privateBucket = args['private-bucket'] || PRIVATE_BUCKET

  console.log('MOXT — setup buckets média Yandex\n')

  ensureBucket(publicBucket, { publicRead: true })
  ensureBucket(privateBucket, { publicRead: false })

  const creds = ensureS3Credentials({ allowEphemeral: true })
  if (!creds) {
    console.warn('\n⚠ Clés S3 absentes — buckets créés, validez les credentials manuellement.')
    printLifecycleHint()
    return
  }

  const client = createStorageS3Client(creds)
  for (const bucket of [publicBucket, privateBucket]) {
    const ok = await validateS3WriteAccess(client, bucket)
    console.log(ok ? `✓ Write OK : ${bucket}` : `✗ Write refusé : ${bucket}`)
  }

  console.log(`
Secrets à poser (Supabase + phase2.env) :
  YANDEX_S3_ACCESS_KEY_ID / MOXT_YC_S3_ACCESS_KEY_ID
  YANDEX_S3_SECRET_ACCESS_KEY / MOXT_YC_S3_SECRET_ACCESS_KEY
  YANDEX_S3_PUBLIC_BUCKET=${publicBucket}
  YANDEX_S3_PRIVATE_BUCKET=${privateBucket}
  MOXT_MEDIA_CDN_BASE=https://cdn.moxtapp.ru
`)

  printLifecycleHint()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
