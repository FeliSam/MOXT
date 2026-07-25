#!/usr/bin/env node
/**
 * Build Capacitor PRODUCTION — assets embarqués dans l’APK (RuStore-compliant).
 *
 * - Compile le front (dist/)
 * - Sync icônes / splash
 * - `cap sync` SANS CAPACITOR_SERVER_URL → WebView locale (pas moxtapp.ru)
 *
 * Usage : npm run cap:prod:sync
 * Puis   : npm run cap:prod:android  ou  gradlew assembleRelease / bundleRelease
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
delete env.CAPACITOR_SERVER_URL
delete env.CAPACITOR_LAN_IP

console.log(`
MOXT Capacitor — build PRODUCTION (standalone)
  • Compile le site (Vite → dist/)
  • Embarque dist/ dans Android / iOS
  • WebView = assets locaux (pas https://moxtapp.ru)
  • Conforme exigence boutique : app autonome, pas un simple WebView wrapper
`)

const result = spawnSync('npm', ['run', 'cap:sync'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env,
})

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}

// Garde-fou : la config Android générée ne doit pas pointer vers le site live.
const androidCapConfig = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json')
if (existsSync(androidCapConfig)) {
  const parsed = JSON.parse(readFileSync(androidCapConfig, 'utf8'))
  const remoteUrl = parsed?.server?.url
  if (remoteUrl && /moxtapp\.ru/i.test(String(remoteUrl))) {
    console.error(`
✗ ERREUR : capacitor.config.json Android pointe encore vers ${remoteUrl}
  L’APK serait un wrapper WebView — refusé par RuStore.
  Vérifiez capacitor.config.ts (pas de server.url en prod).
`)
    process.exit(1)
  }
  if (remoteUrl) {
    console.warn(`⚠ server.url présent (${remoteUrl}) — OK seulement pour le live-reload, pas pour le store.`)
  } else {
    console.log('✓ Config Android : pas de server.url — assets locaux embarqués.')
  }
} else {
  console.warn('⚠ capacitor.config.json Android introuvable après sync.')
}

console.log(`
Prochaines étapes :
  1. npm run cap:open:android   → Run sur émulateur / appareil
  2. Captures d’écran natives (UI russe recommandée pour RuStore)
  3. cd android && .\\gradlew.bat bundleRelease   → AAB signé
`)

process.exit(0)
