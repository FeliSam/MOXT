#!/usr/bin/env node
/**
 * Build Capacitor PRODUCTION — la WebView pointe vers https://moxtapp.ru
 * (voir capacitor.config.ts). dist/ est copié en secours (offline shell) mais
 * l'app charge le site live : chaque déploiement web (npm run cpd) s'applique
 * ensuite instantanément sur les appareils installés, sans nouvelle build native.
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
  • Copie dist/ dans Android / iOS (secours hors-ligne)
  • La WebView charge https://moxtapp.ru — mises à jour web instantanées, sans rebuild
`)

const result = spawnSync('npm', ['run', 'cap:sync'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env,
})

process.exit(result.status ?? 1)
