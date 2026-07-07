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
const isCi = Boolean(process.env.CI || process.env.NETLIFY)

const url = process.env.VITE_SUPABASE_URL || 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!key) {
  if (isCi) {
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
