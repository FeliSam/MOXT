#!/usr/bin/env node
/**
 * One-off: promote a user by name in public.profiles.
 * Usage: node scripts/_promote-user-role.mjs --first Feliciano --last Fanou --role admin
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

function runQuery(sql, env) {
  const result = spawnSync(process.execPath, [supabaseJs, 'db', 'query', '--linked', sql], {
    cwd: root,
    env,
    encoding: 'utf8',
  })
  const out = `${result.stdout || ''}${result.stderr || ''}`.trim()
  if (result.status !== 0 && !out.includes('"rows"')) {
    console.error(out || `db query failed (${result.status})`)
    process.exit(result.status ?? 1)
  }
  return out
}

function parseQueryRows(output) {
  const jsonStart = output.indexOf('{')
  const jsonEnd = output.lastIndexOf('}')
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(output.slice(jsonStart, jsonEnd + 1))
      if (Array.isArray(parsed?.rows)) return parsed.rows
    } catch {
      // fall through
    }
  }
  if (output.toLowerCase().includes('0 rows')) return []
  return output.trim() ? [{ raw: output }] : []
}

function main() {
  const first = arg('--first', 'Feliciano')
  const last = arg('--last', 'Fanou')
  const role = arg('--role', '')
  const status = arg('--status', '')

  if (role && !['admin', 'superadmin', 'moderator', 'user', 'professional'].includes(role)) {
    console.error(`Invalid role: ${role}`)
    process.exit(1)
  }

  if (status && !['verified', 'active', 'suspended'].includes(status)) {
    console.error(`Invalid status: ${status}`)
    process.exit(1)
  }

  if (!role && !status) {
    console.error('Provide --role and/or --status')
    process.exit(1)
  }

  const vars = loadPhase2Env()
  const env = {
    ...process.env,
    ...vars,
    SUPABASE_ACCESS_TOKEN: vars.SUPABASE_ACCESS_TOKEN || '',
    SUPABASE_DB_PASSWORD: vars.SUPABASE_DB_PASSWORD || '',
  }

  if (!env.SUPABASE_DB_PASSWORD) {
    console.error('SUPABASE_DB_PASSWORD missing in scripts/phase2.env')
    process.exit(1)
  }

  const escapedFirst = first.replace(/'/g, "''")
  const escapedLast = last.replace(/'/g, "''")

  console.log(`\nSearching profiles: ${first} ${last}\n`)
  const before = runQuery(
    `SELECT id, first_name, last_name, email, phone, role FROM public.profiles WHERE first_name ILIKE '${escapedFirst}' AND last_name ILIKE '${escapedLast}' ORDER BY updated_at DESC;`,
    env,
  )
  console.log(before)

  const rows = parseQueryRows(before)
  if (!rows.length || rows[0]?.raw) {
    console.error('\nNo matching profile found.')
    process.exit(1)
  }

  const targetId = String(rows[0].id).replace(/'/g, '')
  const updates = []
  if (role) updates.push(`role = '${role}'`)
  if (status) updates.push(`status = '${status}'`)
  updates.push('updated_at = now()')

  console.log(
    `\nUpdating ${rows[0].first_name} ${rows[0].last_name} (${targetId})${
      role ? ` → role ${role}` : ''
    }${status ? ` → status ${status}` : ''}\n`,
  )
  const update = runQuery(
    `BEGIN;
ALTER TABLE public.profiles DISABLE TRIGGER moxt_profiles_privilege_guard;
UPDATE public.profiles SET ${updates.join(', ')} WHERE id = '${targetId}';
ALTER TABLE public.profiles ENABLE TRIGGER moxt_profiles_privilege_guard;
COMMIT;
SELECT id, first_name, last_name, email, role, status FROM public.profiles WHERE id = '${targetId}';`,
    env,
  )
  console.log(update)
  console.log('\nDone. User must sign out and sign in again for profile changes to apply.\n')
}

main()
