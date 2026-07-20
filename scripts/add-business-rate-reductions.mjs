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
alter table public.businesses
  add column if not exists rate_reduction_to_ru numeric not null default 0,
  add column if not exists rate_reduction_from_ru numeric not null default 0;

comment on column public.businesses.rate_reduction_to_ru is
  'Percent haircut on Frankfurter when transferring toward Russia (origin -> RU).';
comment on column public.businesses.rate_reduction_from_ru is
  'Percent haircut on Frankfurter when transferring from Russia (RU -> origin).';

notify pgrst, 'reload schema';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'businesses'
  and column_name like 'rate_reduction%'
order by column_name;
`

const res = await fetch(
  'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  },
)

const body = await res.json().catch(() => null)
console.log(res.status, JSON.stringify(body).slice(0, 1000))
if (!res.ok) process.exit(1)
