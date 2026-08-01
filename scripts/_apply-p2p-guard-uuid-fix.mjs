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

const query = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260721210000_fix_p2p_order_guard_text_uuid.sql'),
  'utf8',
)
const res = await fetch(
  'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  },
)
const body = await res.json().catch(() => null)
console.log(res.status, JSON.stringify(body).slice(0, 2000))
if (!res.ok) process.exit(1)
