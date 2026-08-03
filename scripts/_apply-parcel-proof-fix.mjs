/**
 * Apply parcel passport + storage fix migrations via Management API.
 */
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, 'scripts/phase2.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]
    }),
)

const token = env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN missing')
  process.exit(1)
}

const files = [
  '20260803160000_parcel_passport_and_proof_statuses.sql',
  '20260803180000_phone_assist_requests.sql',
  '20260803190000_parcels_storage_and_proof_guard_fix.sql',
]

async function runQuery(query, label) {
  const res = await fetch(
    'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  )
  const text = await res.text()
  if (!res.ok) {
    console.error(`✗ ${label}: HTTP ${res.status}`)
    console.error(text.slice(0, 800))
    return false
  }
  console.log(`✓ ${label}`)
  return true
}

let ok = true
for (const file of files) {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
  if (!(await runQuery(sql, file))) ok = false
}

const check = `
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='parcels' and column_name='passport_proof_url') as has_passport_url,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='parcels' and column_name='passport_status') as has_passport_status,
  (select count(*) from storage.buckets where id='parcels') as has_parcels_bucket;
`
await runQuery(check, 'verify parcels columns + bucket')

process.exit(ok ? 0 : 1)
