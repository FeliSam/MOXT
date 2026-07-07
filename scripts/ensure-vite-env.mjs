#!/usr/bin/env node
/**
 * Échoue au build CI/Netlify si Supabase n'est pas configuré.
 * Évite un déploiement silencieux en « mode simulé ».
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isCi = Boolean(process.env.CI || process.env.NETLIFY)
if (!isCi) process.exit(0)

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (url && key) {
  console.log('[MOXT] Variables Supabase détectées pour le build.')
  process.exit(0)
}

console.error(`
╔══════════════════════════════════════════════════════════════╗
║  BUILD BLOQUÉ — Supabase non configuré sur Netlify/CI        ║
╠══════════════════════════════════════════════════════════════╣
║  Ajoutez dans Netlify → Environment variables :              ║
║    VITE_SUPABASE_URL                                         ║
║    VITE_SUPABASE_ANON_KEY                                    ║
║                                                              ║
║  Puis : npm run setup:production  (en local)                 ║
║  Ou redéployez après ajout manuel des variables.             ║
╚══════════════════════════════════════════════════════════════╝
`)
process.exit(1)
