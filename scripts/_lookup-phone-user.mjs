#!/usr/bin/env node
import pg from 'pg'
import { loadPhase2Env } from './lib/env.mjs'

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

const phoneTail = arg('--tail', '9999674750')
const vars = loadPhase2Env()
const password = vars.SUPABASE_DB_PASSWORD || vars.MOXT_SUPABASE_DB_PASSWORD || ''

if (!password) {
  console.error('SUPABASE_DB_PASSWORD missing in scripts/phase2.env')
  process.exit(1)
}

const client = new pg.Client({
  host: 'db.rbvqfkccbkwjxkvpnwqn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

const userSql = `
SELECT p.id, p.email, p.phone, p.phone_verified, p.phone_verified_at,
       p.first_name, p.last_name, p.status, p.role, p.created_at,
       u.phone AS auth_phone,
       u.phone_confirmed_at,
       u.email_confirmed_at,
       u.last_sign_in_at,
       u.created_at AS auth_created_at,
       u.encrypted_password IS NOT NULL AS has_password
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.phone ILIKE $1 OR u.phone ILIKE $1
ORDER BY COALESCE(p.created_at, u.created_at) DESC
LIMIT 5;
`

const eventsSql = `
SELECT kind, subject, meta, created_at
FROM public.moxt_security_events
WHERE subject ILIKE $1 OR meta::text ILIKE $1
ORDER BY created_at DESC
LIMIT 10;
`

const { rows: users } = await client.query(userSql, [`%${phoneTail}%`])
const { rows: events } = await client.query(eventsSql, [`%${phoneTail}%`])

console.log(JSON.stringify({ users, recentLoginEvents: events }, null, 2))
await client.end()
