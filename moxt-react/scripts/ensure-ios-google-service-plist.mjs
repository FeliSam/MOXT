#!/usr/bin/env node
/**
 * Appflow / CI : Xcode exige GoogleService-Info.plist (gitignoré).
 * Priorité : variable d’environnement → fichier local → exemple.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const iosApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ios', 'App', 'App')
const dest = path.join(iosApp, 'GoogleService-Info.plist')
const example = path.join(iosApp, 'GoogleService-Info.plist.example')

const fromB64 = (process.env.GOOGLE_SERVICE_INFO_PLIST_B64 || '').trim()
const fromXml = (process.env.GOOGLE_SERVICE_INFO_PLIST || '').trim()

if (fromB64) {
  writeFileSync(dest, Buffer.from(fromB64, 'base64'))
  console.log('[ios] GoogleService-Info.plist écrit depuis GOOGLE_SERVICE_INFO_PLIST_B64')
  process.exit(0)
}
if (fromXml) {
  writeFileSync(dest, fromXml.includes('<plist') ? fromXml : `${fromXml}\n`)
  console.log('[ios] GoogleService-Info.plist écrit depuis GOOGLE_SERVICE_INFO_PLIST')
  process.exit(0)
}
if (existsSync(dest)) process.exit(0)
if (!existsSync(example)) {
  console.error('[ios] GoogleService-Info.plist.example manquant')
  process.exit(1)
}
copyFileSync(example, dest)
console.log('[ios] GoogleService-Info.plist créé depuis l’exemple (push FCM inactif jusqu’au vrai fichier Firebase)')
