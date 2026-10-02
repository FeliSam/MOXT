#!/usr/bin/env node
/**
 * Setup helper for site-path OG gateway.
 * Prefer infra/site-og-shield/deploy-on-drsam.ps1 on Dr_Sam.
 * This script documents steps and optionally invokes yc when available.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const shieldDir = join(root, 'infra', 'site-og-shield')

function yc(...args) {
  const r = spawnSync('yc', args, { encoding: 'utf8' })
  return r
}

console.log(`
MOXT site-path OG setup
=======================
1. Deploy share-preview (site paths) via supabase functions deploy
2. On Dr_Sam:  .\\infra\\site-og-shield\\deploy-on-drsam.ps1
3. Proof gateway domain with WhatsApp UA
4. Optional cutover: .\\deploy-on-drsam.ps1 -CutoverCdnOrigin
5. Garde-fou: rewrite CLEARED; website origin; never nuclear ^/(.*)$

See docs/site-path-og-crawlers.md
`)

const probe = yc('--version')
if (probe.status !== 0) {
  console.log('yc not available in this environment — leave deploy to Dr_Sam.')
  process.exit(0)
}

console.log('yc found. Prefer PowerShell deploy-on-drsam.ps1 for zip + gateway update.')
console.log('OpenAPI fragment:', join(shieldDir, 'openapi-fragment.yaml'))
