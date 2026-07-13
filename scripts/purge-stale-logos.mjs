#!/usr/bin/env node
/**
 * Supprime les anciens logos SVG placeholders encore présents sur S3.
 */
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { resolveWritableS3Client } from './lib/yandex-s3.mjs'
import { loadPhase2Env } from './lib/env.mjs'

const STALE_KEYS = [
  'favicon.svg',
  'app-icon.svg',
  'assets/logos/X.svg',
  'assets/logos/MOXTlogo.svg',
]

async function main() {
  const env = loadPhase2Env()
  const bucket = process.env.MOXT_S3_BUCKET || env.MOXT_S3_BUCKET || 'moxtapp-web'
  const { client, source, reason } = await resolveWritableS3Client(bucket)
  if (!client) {
    console.error(`✗ Client S3 indisponible (${reason || 'unknown'})`)
    process.exit(1)
  }

  console.log(`\n  Purge logos obsolètes → s3://${bucket} (${source})`)
  for (const key of STALE_KEYS) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
      console.log(`  ✓ deleted ${key}`)
    } catch (error) {
      console.warn(`  ⚠ ${key}:`, error.message)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
