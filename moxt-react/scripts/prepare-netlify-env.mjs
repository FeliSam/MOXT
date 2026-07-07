#!/usr/bin/env node
/**
 * Prépare moxt-react/.env.production avant `vite build` (Netlify / CI).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(root, '.env.production')
const isCi = Boolean(process.env.CI || process.env.NETLIFY)

const url =
  process.env.VITE_SUPABASE_URL || 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
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

if (!key && isCi) {
  console.error('[MOXT] BUILD BLOQUÉ — VITE_SUPABASE_ANON_KEY introuvable.')
  process.exit(1)
}

if (!key) process.exit(0)

writeFileSync(outPath, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${key}\n`, 'utf8')
console.log(`[MOXT] .env.production prêt (${url})`)
