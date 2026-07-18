import fs from 'fs'

const env = Object.fromEntries(
  fs
    .readFileSync('scripts/phase2.env', 'utf8')
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

const query = fs.readFileSync('scripts/sql/fix-support-tickets-messages.sql', 'utf8')

const res = await fetch(
  'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  },
)

const body = await res.json().catch(() => null)
console.log(res.status, JSON.stringify(body).slice(0, 2500))
