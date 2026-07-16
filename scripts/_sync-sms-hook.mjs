/**
 * Regenerate SEND_SMS_HOOK_SECRET and sync Auth + Edge Functions.
 * Must run in Node (never PowerShell) - '+' in base64 gets mangled by shells.
 *
 * Format: v1,whsec_ + standard base64(24 bytes).
 * Prefix length is 9 => total secret length is 41 (not 42; slice(10) falsely reports encLen=31).
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const secretsPath = path.join(root, 'scripts', 'phase2.supabase-secrets.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const PREFIX = 'v1,whsec_'
const EXPECT_TOTAL = PREFIX.length + 32 // 41

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function upsert(file, key, value) {
  let text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const re = new RegExp('^' + key + '=.*$', 'm')
  if (re.test(text)) text = text.replace(re, key + '=' + value)
  else text = text.trimEnd() + '\n' + key + '=' + value + '\n'
  writeFileSync(file, text.endsWith('\n') ? text : text + '\n', 'utf8')
}

function secretMeta(secret) {
  const enc = secret?.startsWith(PREFIX) ? secret.slice(PREFIX.length) : ''
  let bytes = -1
  try {
    bytes = Buffer.from(enc, 'base64').length
  } catch {
    bytes = -1
  }
  return {
    len: secret?.length ?? 0,
    encLen: enc.length,
    bytes,
    hasPlus: enc.includes('+'),
    hasSlash: enc.includes('/'),
    valid: Boolean(
      secret?.startsWith(PREFIX) &&
        secret.length === EXPECT_TOTAL &&
        enc.length === 32 &&
        bytes === 24,
    ),
  }
}

function assertValidHookSecret(secret, label = 'secret') {
  const meta = secretMeta(secret)
  if (!meta.valid) {
    throw new Error(
      label + ' invalid: ' + JSON.stringify(meta) + ' (expect len=' + EXPECT_TOTAL + ', encLen=32, bytes=24)',
    )
  }
  const enc = secret.slice(PREFIX.length)
  const round = Buffer.from(enc, 'base64').toString('base64')
  if (round !== enc) throw new Error(label + ' base64 round-trip mismatch')
  return meta
}

function readHookSecretFromDisk(filePath) {
  if (!existsSync(filePath)) throw new Error('missing ' + filePath)
  const raw = readFileSync(filePath, 'utf8')
  const lines = [...raw.matchAll(/^SEND_SMS_HOOK_SECRET=(.+)$/gm)].map((m) => m[1].trim())
  if (lines.length === 0) throw new Error('no SEND_SMS_HOOK_SECRET in ' + filePath)
  if (lines.length > 1) {
    throw new Error('duplicate SEND_SMS_HOOK_SECRET in ' + filePath + ': count=' + lines.length)
  }
  return lines[0]
}

const encoded = randomBytes(24).toString('base64')
const secret = PREFIX + encoded
assertValidHookSecret(secret, 'generated')

upsert(envPath, 'SEND_SMS_HOOK_SECRET', secret)
upsert(secretsPath, 'SEND_SMS_HOOK_SECRET', secret)

const diskEnv = readHookSecretFromDisk(envPath)
const diskSecrets = readHookSecretFromDisk(secretsPath)
const metaEnv = assertValidHookSecret(diskEnv, 'phase2.env')
const metaSecrets = assertValidHookSecret(diskSecrets, 'phase2.supabase-secrets.env')
if (diskEnv !== secret || diskSecrets !== secret) {
  throw new Error('disk mismatch after write (env vs generated or secrets file)')
}
if (diskEnv !== diskSecrets) {
  throw new Error('phase2.env and phase2.supabase-secrets.env secrets diverge')
}

const env = parseEnv(envPath)
const token = env.SUPABASE_ACCESS_TOKEN
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN missing')

console.log(
  JSON.stringify({
    local_secret: {
      phase2_env: metaEnv,
      supabase_secrets_env: metaSecrets,
      prefixLen: PREFIX.length,
      expectTotal: EXPECT_TOTAL,
    },
  }),
)

const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
const secretsResult = spawnSync(
  process.execPath,
  [supabaseJs, 'secrets', 'set', '--env-file', secretsPath, '--project-ref', projectRef],
  {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  },
)
process.stdout.write(secretsResult.stdout || '')
process.stderr.write(secretsResult.stderr || '')
const secretsOut = (secretsResult.stdout || '') + '\n' + (secretsResult.stderr || '')
const secretsOk =
  secretsResult.status === 0 ||
  (/Finished supabase secrets set/i.test(secretsOut) &&
    /Timeout while shutting down PostHog/i.test(secretsOut))
if (!secretsOk) {
  console.error('secrets set failed')
  process.exit(1)
}
console.log('edge_secrets=ok')

const authRes = await fetch('https://api.supabase.com/v1/projects/' + projectRef + '/config/auth', {
  method: 'PATCH',
  headers: {
    Authorization: 'Bearer ' + token,
    apikey: token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    hook_send_sms_enabled: true,
    hook_send_sms_uri: 'https://' + projectRef + '.supabase.co/functions/v1/send-sms',
    hook_send_sms_secrets: diskEnv,
  }),
})
const authText = await authRes.text()
if (!authRes.ok) {
  console.error('auth patch failed', authRes.status, authText.slice(0, 200))
  process.exit(1)
}
console.log(JSON.stringify({ auth_hook: 'synced', status: authRes.status }))

const ts = Math.floor(Date.now() / 1000).toString()
const badRes = await fetch('https://' + projectRef + '.supabase.co/functions/v1/send-sms', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'webhook-id': 'msg_probe_bad_sig',
    'webhook-timestamp': ts,
    'webhook-signature': 'v1,dGVzdA==',
  },
  body: '{}',
})
const badBody = await badRes.text()
console.log(
  JSON.stringify({
    send_sms_reject_bad_sig: badRes.status,
    expect: 401,
    body: badBody.slice(0, 240),
  }),
)
process.exit(badRes.status === 401 ? 0 : 2)
