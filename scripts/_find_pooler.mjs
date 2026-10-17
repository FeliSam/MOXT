import pg from 'pg'
import { loadPhase2Env } from './lib/env.mjs'

const vars = loadPhase2Env()
const password = vars.SUPABASE_DB_PASSWORD || vars.MOXT_SUPABASE_DB_PASSWORD || ''

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-central-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-south-1',
  'ca-central-1',
]

for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`
  const client = new pg.Client({
    host,
    port: 5432,
    database: 'postgres',
    user: 'postgres.rbvqfkccbkwjxkvpnwqn',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000,
  })

  try {
    await client.connect()
    console.log(`\n\n🎉 FOUND WORKING POOLER! Region: ${region} (${host})`)
    const res = await client.query('SELECT 1 as test;')
    console.log('Query result:', res.rows)
    await client.end()
    process.exit(0)
  } catch (e) {
    if (e.message.includes('password authentication failed')) {
      console.log(`\n\n🎉 FOUND POOLER (auth failed): Region: ${region}`)
      process.exit(0)
    }
    process.stdout.write(`[${region}: ${e.message.slice(0, 30)}] `)
    try { await client.end() } catch {}
  }
}
console.log('\nDone searching regions.')
