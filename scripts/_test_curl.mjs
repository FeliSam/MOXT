import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const env = readFileSync('scripts/phase2.env', 'utf8')
const token = env.match(/SUPABASE_ACCESS_TOKEN=(.+)/)?.[1]?.trim()

writeFileSync('scripts/_temp_test_query.json', JSON.stringify({ query: 'SELECT 1 as test;' }))

const res = spawnSync('curl.exe', [
  '-s',
  '-X', 'POST',
  'https://api.supabase.com/v1/projects/rbvqfkccbkwjxkvpnwqn/database/query',
  '-H', `Authorization: Bearer ${token}`,
  '-H', 'Content-Type: application/json',
  '--data', '@scripts/_temp_test_query.json',
], { encoding: 'utf8' })

console.log('Status:', res.status)
console.log('Output:', res.stdout)
if (res.stderr) console.log('Stderr:', res.stderr)

try { unlinkSync('scripts/_temp_test_query.json') } catch {}
