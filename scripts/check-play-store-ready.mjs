#!/usr/bin/env node
/**
 * Vérifie la préparation Google Play côté repo (sans compte Play Console).
 *
 * Usage : npm run check:play-store
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const androidRoot = path.join(root, 'moxt-react', 'android')
const appGradle = path.join(androidRoot, 'app', 'build.gradle')
const manifest = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml')
const variables = path.join(androidRoot, 'variables.gradle')
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
console.log('  MOXT — checklist Google Play (repo)')
console.log('══════════════════════════════════════\n')

console.log('▸ Identité & versions')
const gradle = read(appGradle)
const vars = read(variables)
if (gradle.includes('applicationId "com.moxt.app"')) ok('applicationId com.moxt.app')
else fail('applicationId incorrect')
if (gradle.includes(`versionName "${expectedVersion}"`)) ok(`versionName ${expectedVersion}`)
else fail(`versionName doit être ${expectedVersion}`)
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1]
if (versionCode) ok(`versionCode ${versionCode}`)
else fail('versionCode manquant')

const targetSdk = vars.match(/targetSdkVersion\s*=\s*(\d+)/)?.[1]
const compileSdk = vars.match(/compileSdkVersion\s*=\s*(\d+)/)?.[1]
const minSdk = vars.match(/minSdkVersion\s*=\s*(\d+)/)?.[1]
if (Number(targetSdk) >= 35) ok(`targetSdk ${targetSdk} (≥ 35 Play)`)
else fail(`targetSdk ${targetSdk || '?'} — Play exige un niveau récent (35+)`)
if (compileSdk) ok(`compileSdk ${compileSdk}`)
if (Number(minSdk) >= 24) ok(`minSdk ${minSdk}`)
else warn(`minSdk ${minSdk}`)

console.log('\n▸ Manifest / permissions')
const man = read(manifest)
if (man.includes('usesCleartextTraffic="false"')) ok('usesCleartextTraffic=false (release)')
else fail('usesCleartextTraffic=false manquant sur application (release)')
if (man.includes('AD_ID') && man.includes('tools:node="remove"')) {
  ok('AD_ID retiré (pas de pubs / Data safety)')
} else warn('retirer com.google.android.gms.permission.AD_ID si pas de pubs')
if (man.includes('READ_SMS') || man.includes('RECEIVE_SMS') || man.includes('SEND_SMS')) {
  fail('Permission SMS détectée — à éviter pour Play')
} else ok('Pas de permission SMS')
if (man.includes('ACCESS_FINE_LOCATION') || man.includes('ACCESS_COARSE_LOCATION')) {
  warn('Permission localisation déclarée — justifier dans Data safety')
} else ok('Pas de localisation GPS')
if (man.includes('CAMERA')) ok('CAMERA déclarée')
if (man.includes('POST_NOTIFICATIONS')) ok('POST_NOTIFICATIONS déclarée')
if (man.includes('scheme="moxt"')) ok('Deep link moxt://')

const debugMan = read(path.join(androidRoot, 'app', 'src', 'debug', 'AndroidManifest.xml'))
if (debugMan.includes('usesCleartextTraffic="true"')) {
  ok('Debug : cleartext autorisé (live-reload uniquement)')
}

console.log('\n▸ Signature release')
const keyProps = path.join(androidRoot, 'key.properties')
const keyExample = path.join(androidRoot, 'key.properties.example')
const keystoreJks = path.join(androidRoot, 'keystore', 'moxt-release.jks')
if (existsSync(keyExample)) ok('key.properties.example présent')
else warn('key.properties.example manquant')
if (existsSync(keyProps)) ok('key.properties présent (local, gitignoré)')
else warn('key.properties absent — npm run android:keystore')
if (existsSync(keystoreJks)) ok('keystore/moxt-release.jks présent')
else warn('keystore absent — npm run android:keystore (sauvegarder hors repo)')

console.log('\n▸ Firebase / Push')
const gs = path.join(androidRoot, 'app', 'google-services.json')
const gsExample = path.join(androidRoot, 'app', 'google-services.json.example')
if (existsSync(gsExample)) ok('google-services.json.example présent')
if (existsSync(gs)) {
  try {
    const parsed = JSON.parse(readFileSync(gs, 'utf8'))
    const pkg =
      parsed?.client?.[0]?.client_info?.android_client_info?.package_name || ''
    if (pkg === 'com.moxt.app') ok('google-services.json package com.moxt.app')
    else if (pkg.includes('placeholder') || !pkg) warn('google-services.json placeholder ?')
    else warn(`google-services.json package=${pkg}`)
  } catch {
    warn('google-services.json illisible')
  }
} else warn('google-services.json absent — push FCM inactif')

console.log('\n▸ Capacitor prod (pas de wrapper WebView)')
const capJson = path.join(
  androidRoot,
  'app',
  'src',
  'main',
  'assets',
  'capacitor.config.json',
)
if (existsSync(capJson)) {
  try {
    const parsed = JSON.parse(readFileSync(capJson, 'utf8'))
    const url = parsed?.server?.url
    if (!url) ok('capacitor.config.json sans server.url')
    else if (/moxtapp\.ru/i.test(String(url))) fail(`server.url → ${url} (refusé Play)`)
    else warn(`server.url = ${url} (live-reload seulement)`)
  } catch {
    warn('capacitor.config.json illisible')
  }
} else warn('capacitor.config.json absent — npm run web:cap:prod:sync')

console.log('\n▸ Documentation & métadonnées')
const listing = path.join(root, 'docs', 'google-play-listing.md')
if (existsSync(listing)) ok('docs/google-play-listing.md')
else fail('docs/google-play-listing.md manquant')
const metaDir = path.join(root, 'moxt-react', 'store-metadata', 'android')
if (existsSync(path.join(metaDir, 'short-description-fr.txt'))) ok('store-metadata/android/')
else fail('textes store-metadata/android manquants')

console.log('\n══════════════════════════════════════')
if (failed > 0) {
  console.log(`  ✗ ${failed} erreur(s), ${warned} avertissement(s)`)
  console.log('══════════════════════════════════════\n')
  process.exit(1)
}
console.log(`  ✓ Repo prêt côté fichiers (${warned} avertissement(s) hors compte Play)`)
console.log('  Build AAB : npm run android:aab')
console.log('  Guide     : docs/google-play-listing.md')
console.log('══════════════════════════════════════\n')
process.exit(0)
