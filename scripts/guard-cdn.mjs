#!/usr/bin/env node
/**
 * Garde-fou CDN Moxt — échoue si la config live peut couper moxtapp.ru.
 * Usage: node scripts/guard-cdn.mjs
 */
import { assertCdnSpaGuard, MOXT_CDN_LOCK } from './lib/yandex-cdn.mjs'

const resourceId = process.env.MOXT_CDN_RESOURCE_ID || MOXT_CDN_LOCK.resourceId
const bucket = process.env.MOXT_YC_BUCKET || MOXT_CDN_LOCK.bucket

try {
  const ok = assertCdnSpaGuard(resourceId, bucket)
  console.log('[cdn-guard] OK', ok)
  process.exit(0)
} catch (err) {
  console.error(String(err?.stack || err))
  process.exit(1)
}
