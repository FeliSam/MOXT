#!/usr/bin/env node
/**
 * Prépare moxt-react/.env.production avant `vite build`.
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
const outPath = path.join(root, '.env.production')
const isDeploy = Boolean(process.env.NETLIFY || process.env.CI)

let url = process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
let key =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!key) {
  const localPath = path.join(root, '.env.local')
  if (existsSync(localPath)) {
    for (const line of readFileSync(localPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        key = trimmed.slice('VITE_SUPABASE_ANON_KEY='.length).trim()
        break
      }
    }
  }
}

if (!key && isDeploy) {
  key = PUBLIC_ANON_KEY
}

if (!key) process.exit(0)

function readPhase2VapidPublic() {
  const phase2 = path.join(root, '..', 'scripts', 'phase2.env')
  if (!existsSync(phase2)) return ''
  let vapid = ''
  for (const line of readFileSync(phase2, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.startsWith('VITE_VAPID_PUBLIC_KEY=')) {
      vapid = trimmed.slice('VITE_VAPID_PUBLIC_KEY='.length).trim()
      break
    }
    if (!vapid && trimmed.startsWith('VAPID_PUBLIC_KEY=')) {
      vapid = trimmed.slice('VAPID_PUBLIC_KEY='.length).trim()
    }
  }
  return vapid
}

const vapidPublic =
  process.env.VITE_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  readPhase2VapidPublic()

const lines = [`VITE_SUPABASE_URL=${url}`, `VITE_SUPABASE_ANON_KEY=${key}`]
if (vapidPublic) lines.push(`VITE_VAPID_PUBLIC_KEY=${vapidPublic}`)
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
console.log(
  `[MOXT] .env.production prêt (${url}${vapidPublic ? ', VAPID inclus' : ', VAPID absent'})`,
)
