#!/usr/bin/env node
/**
 * Build Capacitor PRODUCTION — embarque moxt-react/dist dans l'APK/IPA.
 * N'utilise PAS localhost ni le live reload.
 *
 * Usage : npm run cap:prod:sync
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
delete env.CAPACITOR_SERVER_URL
delete env.CAPACITOR_LAN_IP

console.log(`
MOXT Capacitor — build PRODUCTION
  • Compile le site (même config que Netlify / Supabase)
  • Copie dist/ dans Android / iOS
  • Pas de localhost — l'app fonctionne hors ligne (sauf API Supabase)
`)

const result = spawnSync('npm', ['run', 'cap:sync'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env,
})

process.exit(result.status ?? 1)
