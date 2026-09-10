#!/usr/bin/env node
/**
 * Appflow / CI : Xcode exige GoogleService-Info.plist, gitignoré en local.
 * Si le fichier réel est absent, copie l’exemple pour que l’archive iOS passe.
 */
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const iosApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ios', 'App', 'App')
const dest = path.join(iosApp, 'GoogleService-Info.plist')
const example = path.join(iosApp, 'GoogleService-Info.plist.example')

if (existsSync(dest)) process.exit(0)
if (!existsSync(example)) {
  console.error('[ios] GoogleService-Info.plist.example manquant')
  process.exit(1)
}
copyFileSync(example, dest)
console.log('[ios] GoogleService-Info.plist créé depuis l’exemple (push FCM inactif jusqu’au vrai fichier Firebase)')
