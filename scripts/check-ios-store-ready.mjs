#!/usr/bin/env node
/**
 * Vérifie la préparation App Store côté repo (sans Mac / sans compte Apple).
 *
 * Usage : npm run check:ios-store
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const iosApp = path.join(root, 'moxt-react', 'ios', 'App', 'App')
const pbxproj = path.join(root, 'moxt-react', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')

const expectedVersion = JSON.parse(
  readFileSync(path.join(root, 'moxt-react', 'package.json'), 'utf8'),
).version

let failed = 0
let warned = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
}

function warn(label) {
  warned += 1
  console.log(`  ⚠ ${label}`)
}

function fail(label) {
  failed += 1
  console.log(`  ✗ ${label}`)
}

function read(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

console.log('\n══════════════════════════════════════')
console.log('  MOXT — checklist App Store (repo)')
console.log('══════════════════════════════════════\n')

console.log('▸ Projet iOS')
if (existsSync(path.join(root, 'moxt-react', 'ios'))) ok('dossier moxt-react/ios présent')
else fail('dossier moxt-react/ios manquant')

const info = read(path.join(iosApp, 'Info.plist'))
if (info.includes('ITSAppUsesNonExemptEncryption')) ok('ITSAppUsesNonExemptEncryption dans Info.plist')
else fail('ITSAppUsesNonExemptEncryption manquant')
if (info.includes('NSCameraUsageDescription')) ok('NSCameraUsageDescription')
else fail('NSCameraUsageDescription manquant')
if (info.includes('NSPhotoLibraryUsageDescription')) ok('NSPhotoLibraryUsageDescription')
else fail('NSPhotoLibraryUsageDescription manquant')
if (info.includes('remote-notification')) ok('UIBackgroundModes remote-notification')
else fail('UIBackgroundModes remote-notification manquant')

console.log('\n▸ Signing / Push')
const debugEnt = read(path.join(iosApp, 'App.entitlements'))
const releaseEnt = read(path.join(iosApp, 'AppRelease.entitlements'))
if (debugEnt.includes('development')) ok('App.entitlements → aps-environment development')
else fail('App.entitlements (debug) incorrect')
if (releaseEnt.includes('production')) ok('AppRelease.entitlements → aps-environment production')
else fail('AppRelease.entitlements (production) incorrect')

const project = read(pbxproj)
if (project.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements')) {
  ok('Debug branché sur App.entitlements')
} else fail('CODE_SIGN_ENTITLEMENTS Debug manquant dans pbxproj')
if (project.includes('CODE_SIGN_ENTITLEMENTS = App/AppRelease.entitlements')) {
  ok('Release branché sur AppRelease.entitlements')
} else fail('CODE_SIGN_ENTITLEMENTS Release manquant dans pbxproj')
if (project.includes(`MARKETING_VERSION = ${expectedVersion}`)) {
  ok(`MARKETING_VERSION = ${expectedVersion}`)
} else fail(`MARKETING_VERSION doit être ${expectedVersion}`)
if (/CURRENT_PROJECT_VERSION = \d+/.test(project)) {
  const build = project.match(/CURRENT_PROJECT_VERSION = (\d+)/)?.[1]
  ok(`CURRENT_PROJECT_VERSION = ${build}`)
} else fail('CURRENT_PROJECT_VERSION manquant')

console.log('\n▸ Privacy Manifest')
const privacy = path.join(iosApp, 'PrivacyInfo.xcprivacy')
if (existsSync(privacy)) ok('PrivacyInfo.xcprivacy présent')
else fail('PrivacyInfo.xcprivacy manquant')
if (project.includes('PrivacyInfo.xcprivacy in Resources')) ok('PrivacyInfo inclus dans Resources')
else fail('PrivacyInfo non listé dans Resources du pbxproj')

console.log('\n▸ Firebase / Push (fichiers locaux)')
const plist = path.join(iosApp, 'GoogleService-Info.plist')
const example = path.join(iosApp, 'GoogleService-Info.plist.example')
if (existsSync(example)) ok('GoogleService-Info.plist.example présent')
else warn('exemple GoogleService-Info manquant')
if (existsSync(plist)) {
  const body = read(plist)
  if (body.includes('REPLACE_WITH_FIREBASE') || body.includes('moxt-placeholder')) {
    warn('GoogleService-Info.plist encore un placeholder — npm run setup:firebase:ios')
  } else if (body.includes('com.moxt.app')) {
    ok('GoogleService-Info.plist présent (com.moxt.app, gitignoré)')
  } else {
    warn('GoogleService-Info.plist présent — vérifier BUNDLE_ID=com.moxt.app')
  }
} else {
  warn('GoogleService-Info.plist absent — npm run setup:firebase:ios')
}

console.log('\n▸ Capacitor prod (pas de wrapper WebView)')
const capConfig = path.join(root, 'moxt-react', 'capacitor.config.ts')
const capTs = read(capConfig)
if (capTs.includes('CAPACITOR_SERVER_URL') && capTs.includes('isDevServer')) {
  ok('capacitor.config.ts : server.url réservé au live-reload')
} else warn('vérifier manuellement l’absence de server.url en prod')

const iosCapJson = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'capacitor.config.json')
if (existsSync(iosCapJson)) {
  try {
    const parsed = JSON.parse(readFileSync(iosCapJson, 'utf8'))
    const url = parsed?.server?.url
    if (!url) ok('ios/.../capacitor.config.json sans server.url')
    else if (/moxtapp\.ru/i.test(String(url))) fail(`server.url pointe vers ${url} — refusé App Store`)
    else warn(`server.url = ${url} (OK seulement en live-reload)`)
  } catch {
    warn('capacitor.config.json iOS illisible')
  }
} else {
  warn('capacitor.config.json iOS absent — lancez npm run web:cap:prod:sync')
}

console.log('\n▸ Documentation')
const listing = path.join(root, 'docs', 'appstore-listing.md')
if (existsSync(listing)) ok('docs/appstore-listing.md')
else fail('docs/appstore-listing.md manquant')

console.log('\n══════════════════════════════════════')
if (failed > 0) {
  console.log(`  ✗ ${failed} erreur(s), ${warned} avertissement(s)`)
  console.log('══════════════════════════════════════\n')
  process.exit(1)
}
console.log(`  ✓ Repo prêt côté fichiers (${warned} avertissement(s) hors Mac/compte)`)
console.log('  Prochaine étape Mac : npm run web:cap:prod:ios')
console.log('  Guide : docs/appstore-listing.md')
console.log('══════════════════════════════════════\n')
process.exit(0)
