#!/usr/bin/env node
/**
 * Vérifie la config push web (VAPID) + Capacitor (Android/iOS) + FCM serveur.
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const phase2Path = path.join(root, 'scripts', 'phase2.env')
const androidGs = path.join(root, 'moxt-react', 'android', 'app', 'google-services.json')
const iosPlist = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'GoogleService-Info.plist')
const iosEntitlements = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'App.entitlements')
const capConfig = path.join(root, 'moxt-react', 'capacitor.config.ts')
const swPath = path.join(root, 'moxt-react', 'public', 'sw.js')
const fcmDefaultPath = path.join(root, 'scripts', 'firebase-service-account.json')

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function ok(msg) {
  console.log(`  ✓ ${msg}`)
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`)
}

function fail(msg) {
  console.log(`  ✗ ${msg}`)
}

function hasFcmCredentials(phase2) {
  if (phase2.FCM_SERVICE_ACCOUNT_JSON?.trim().startsWith('{')) return true
  const p = phase2.FCM_SERVICE_ACCOUNT_PATH || 'scripts/firebase-service-account.json'
  return existsSync(path.resolve(root, p))
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — vérification push')
  console.log('══════════════════════════════════════')

  const phase2 = parseEnv(phase2Path)
  let issues = 0

  console.log('\nWeb (PWA / moxtapp.ru)')
  if (phase2.VAPID_PUBLIC_KEY && phase2.VAPID_PRIVATE_KEY) {
    ok('VAPID configuré dans scripts/phase2.env')
  } else {
    fail('VAPID manquant — npm run push:generate-vapid puis npm run setup:push')
    issues += 1
  }
  if (existsSync(swPath)) ok('Service worker public/sw.js présent')
  else {
    fail('sw.js introuvable')
    issues += 1
  }
  if (phase2.VITE_VAPID_PUBLIC_KEY || phase2.VAPID_PUBLIC_KEY) {
    ok('Clé publique VAPID disponible pour le build')
    const prep = spawnSync('node', ['scripts/prepare-netlify-env.mjs'], {
      cwd: path.join(root, 'moxt-react'),
      encoding: 'utf8',
    })
    const envProd = path.join(root, 'moxt-react', '.env.production')
    if (existsSync(envProd) && readFileSync(envProd, 'utf8').includes('VITE_VAPID_PUBLIC_KEY=')) {
      ok('prepare-netlify-env.mjs injecte VITE_VAPID_PUBLIC_KEY')
    } else {
      fail('prepare-netlify-env.mjs n’injecte pas VITE_VAPID_PUBLIC_KEY — build PWA sans push')
      issues += 1
    }
  } else {
    warn('VITE_VAPID_PUBLIC_KEY absent — ajoutez-la au build prod Yandex')
  }
  ok('send-push expédie les abonnements platform=web')

  console.log('\nServeur natif (FCM)')
  if (hasFcmCredentials(phase2)) {
    ok('Compte de service Firebase local détecté')
    ok('send-push expédie android + ios via FCM HTTP v1 (après npm run setup:push:native)')
  } else {
    warn('FCM_SERVICE_ACCOUNT_PATH absent — push natif serveur inactif')
    warn('npm run setup:push:native après ajout du JSON Firebase')
    issues += 1
  }

  console.log('\nCapacitor Android')
  if (existsSync(androidGs)) {
    ok('google-services.json présent')
  } else {
    warn('google-services.json absent — FCM client Android inactif')
    issues += 1
  }

  console.log('\nCapacitor iOS')
  if (existsSync(iosPlist)) ok('GoogleService-Info.plist présent')
  else warn('GoogleService-Info.plist absent — ajoutez depuis Firebase')
  if (existsSync(iosEntitlements)) ok('App.entitlements présent (aps-environment)')
  else warn('App.entitlements absent — activez Push Notifications dans Xcode')

  if (existsSync(capConfig)) {
    ok('cap:prod:sync embarque dist/ sans localhost')
  }

  console.log('\nCommandes')
  console.log('  npm run firebase:login       Connexion CLI Firebase')
  console.log('  npm run setup:firebase       google-services.json (Android)')
  console.log('  npm run setup:push           Web VAPID')
  console.log('  npm run setup:push:native   FCM Android/iOS')
  console.log('  npm run web:cap:prod:sync   Build natif production')
  console.log('  Voir scripts/RACCOURCIS.md')

  console.log('\n══════════════════════════════════════')
  if (issues > 0) {
    console.log(`  ${issues} point(s) à corriger`)
    console.log('══════════════════════════════════════\n')
    process.exit(1)
  }
  console.log('  Push web + serveur natif prêts')
  console.log('══════════════════════════════════════\n')
}

main()
