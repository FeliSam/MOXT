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
  console.error('SUPABASE_ACCESS_TOKEN introuvable dans scripts/phase2.env')
  process.exit(1)
}

const query = `
alter table public.business_documents add column if not exists category text not null default 'company';
notify pgrst, 'reload schema';
select column_name from information_schema.columns where table_name='business_documents' order by ordinal_position;
`

const res = await fetch('https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})

const body = await res.json().catch(() => null)
console.log(res.status, JSON.stringify(body).slice(0, 1000))
