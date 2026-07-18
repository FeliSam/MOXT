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

const query = `
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'support_tickets'
order by ordinal_position
`

const res = await fetch(
  'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  },
)

console.log(res.status, JSON.stringify(await res.json(), null, 2))
