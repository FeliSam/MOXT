#!/usr/bin/env node
/** Applique les migrations en attente via Supabase Management API (contourne db push / port 5432). */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'

const PENDING = [
  '20260826120000_notify_transfer_parties.sql',
  '20260827100000_media_objects.sql',
  '20260827123000_reviews_realtime_active_ratings.sql',
  '20260827140000_auto_complete_paid_out_transfers.sql',
]

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[trimmed.slice(0, eq).trim()] = value
  }
  return vars
}

async function applySql(token, query, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = body ? JSON.stringify(body).slice(0, 600) : await res.text()
    throw new Error(`${label} HTTP ${res.status}: ${detail}`)
  }
  console.log(`✓ ${label}`)
  return body
}

async function main() {
  const env = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN manquant (phase2.env)')

  for (const file of PENDING) {
    const filePath = path.join(root, 'supabase', 'migrations', file)
    const query = readFileSync(filePath, 'utf8')
    console.log(`▸ ${file}`)
    await applySql(token, query, file)
  }

  console.log('\n✓ Migrations appliquées via Management API.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
