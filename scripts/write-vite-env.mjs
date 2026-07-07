#!/usr/bin/env node
/**
 * Écrit moxt-react/.env.production avant le build Vite (Netlify / CI).
 * Garantit que les variables VITE_* sont lues même si le contexte npm les masque.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(root, 'moxt-react', '.env.production')
const isNetlify = Boolean(process.env.NETLIFY)

const PUBLIC_SUPABASE_URL = 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
const PUBLIC_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnFma2NjYmt3anhrdnBud3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjI2NDMsImV4cCI6MjA5ODIzODY0M30.ZpAr5eEnxoxy3TQ4hIA3SoX1NTuPg-0pt4UQ2mS5lDI'

const url = process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
let key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!key && isNetlify) {
  key = PUBLIC_ANON_KEY
}

if (!key) {
  if (isNetlify) {
    console.error(`
[MOXT] BUILD BLOQUÉ — VITE_SUPABASE_ANON_KEY absente au moment du build.

Dans Netlify → Site → Environment variables, ajoutez :
  VITE_SUPABASE_ANON_KEY = <copiez depuis moxt-react/.env.local>

Important : cochez le scope « Builds » (pas seulement Runtime).
Puis : Deploys → Clear cache and deploy site.
`)
    process.exit(1)
  }
  process.exit(0)
}

const lines = [
  `VITE_SUPABASE_URL=${url}`,
  `VITE_SUPABASE_ANON_KEY=${key}`,
]
if (process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  lines.push(`VITE_SUPABASE_PUBLISHABLE_KEY=${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`)
}

writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`[MOXT] Variables Supabase prêtes pour le build (${url})`)
