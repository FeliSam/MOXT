#!/usr/bin/env node
/** Apply the two pending migrations via Supabase Management API. */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'

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
  console.log(`${label}: HTTP ${res.status}`)
  if (body) console.log(JSON.stringify(body).slice(0, 800))
  if (!res.ok) throw new Error(`${label} failed`)
}

async function main() {
  const env = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN missing')

  const files = [
    '20260723120000_p2p_reactivate_offer_on_cancel.sql',
    '20260723120100_notify_admins_new_signup.sql',
  ]

  for (const file of files) {
    const query = readFileSync(path.join(root, 'supabase', 'migrations', file), 'utf8')
    console.log(`\n▸ Applying ${file}`)
    await applySql(token, query, file)
  }

  console.log('\n✓ Migrations applied via Management API\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
