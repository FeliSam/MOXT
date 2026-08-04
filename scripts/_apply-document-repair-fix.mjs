/**
 * Apply document repair no-reconfirm migration via Management API.
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

const file = '20260804120000_document_repair_no_reconfirm.sql'

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
    console.error(text.slice(0, 1200))
    return false
  }
  console.log(`✓ ${label}`)
  if (text && text !== '[]' && text !== 'null') {
    console.log(text.slice(0, 500))
  }
  return true
}

const sql = fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')
if (!(await runQuery(sql, file))) process.exit(1)

await runQuery(
  `select public.moxt_dedupe_documents() as dedupe;`,
  'smoke dedupe',
)

process.exit(0)
