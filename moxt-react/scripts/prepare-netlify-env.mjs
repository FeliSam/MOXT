#!/usr/bin/env node
/**
 * Prépare les fichiers env Vite avant `vite` / `vite build`.
 * - Prod : `.env.production` (Supabase + VAPID)
 * - Dev  : `.env.development.local` (VAPID depuis phase2.env si présent)
 *
 * Sur Netlify/CI : utilise les variables d'environnement ou les valeurs publiques par défaut.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Clé anon publique (côté client) — identique à netlify.toml */
const PUBLIC_SUPABASE_URL = 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
const PUBLIC_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnFma2NjYmt3anhrdnBud3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjI2NDMsImV4cCI6MjA5ODIzODY0M30.ZpAr5eEnxoxy3TQ4hIA3SoX1NTuPg-0pt4UQ2mS5lDI'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const monorepoRoot = path.resolve(root, '..')
const outProdPath = path.join(root, '.env.production')
const outDevPath = path.join(root, '.env.development.local')
const isDeploy = Boolean(process.env.NETLIFY || process.env.CI)

function parseEnvLineValue(line, key) {
  const prefix = `${key}=`
  if (!line.startsWith(prefix)) return null
  return line.slice(prefix.length).trim()
}

function readPhase2VapidPublic() {
  const phase2 = path.join(monorepoRoot, 'scripts', 'phase2.env')
  if (!existsSync(phase2)) return ''
  let vapid = ''
  let fallback = ''
  for (const line of readFileSync(phase2, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const viteKey = parseEnvLineValue(trimmed, 'VITE_VAPID_PUBLIC_KEY')
    if (viteKey) {
      vapid = viteKey
      break
    }
    const publicKey = parseEnvLineValue(trimmed, 'VAPID_PUBLIC_KEY')
    if (publicKey && !fallback) fallback = publicKey
  }
  return vapid || fallback
}

function upsertEnvKey(filePath, key, value) {
  const line = `${key}=${value}`
  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${line}\n`, 'utf8')
    return
  }
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  let found = false
  const next = lines.map((raw) => {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.startsWith(`${key}=`)) return raw
    found = true
    return line
  })
  if (!found) {
    while (next.length && next[next.length - 1] === '') next.pop()
    next.push(line, '')
  }
  writeFileSync(filePath, `${next.join('\n').replace(/\n?$/, '\n')}`, 'utf8')
}

let url = process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
let key =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!key) {
  const localPath = path.join(root, '.env.local')
  if (existsSync(localPath)) {
    for (const line of readFileSync(localPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      const anon = parseEnvLineValue(trimmed, 'VITE_SUPABASE_ANON_KEY')
      if (anon) {
        key = anon
        break
      }
    }
  }
}

if (!key && isDeploy) {
  key = PUBLIC_ANON_KEY
}

const vapidPublic =
  process.env.VITE_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  readPhase2VapidPublic()

if (vapidPublic) {
  upsertEnvKey(outDevPath, 'VITE_VAPID_PUBLIC_KEY', vapidPublic)
  console.log('[MOXT] .env.development.local : VAPID injecté (dev / npm run web)')
} else {
  console.log(
    '[MOXT] VAPID absent — push web désactivé. Générer : npm run push:generate-vapid (scripts/phase2.env)',
  )
}

if (!key) {
  console.log('[MOXT] .env.production ignoré (clé anon absente — hors CI)')
  process.exit(0)
}

const lines = [`VITE_SUPABASE_URL=${url}`, `VITE_SUPABASE_ANON_KEY=${key}`]
if (vapidPublic) lines.push(`VITE_VAPID_PUBLIC_KEY=${vapidPublic}`)
writeFileSync(outProdPath, `${lines.join('\n')}\n`, 'utf8')
console.log(
  `[MOXT] .env.production prêt (${url}${vapidPublic ? ', VAPID inclus' : ', VAPID absent'})`,
)
