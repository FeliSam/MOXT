#!/usr/bin/env node
/**
 * Configure push natif Capacitor (FCM Android + iOS via Firebase).
 *
 * Prérequis Firebase :
 *   1. Projet Firebase pour com.moxt.app
 *   2. Télécharger google-services.json → moxt-react/android/app/
 *   3. Télécharger GoogleService-Info.plist → moxt-react/ios/App/App/
 *   4. Compte de service Firebase → scripts/firebase-service-account.json
 *
 * scripts/phase2.env :
 *   FCM_SERVICE_ACCOUNT_PATH=scripts/firebase-service-account.json
 *   FCM_GOOGLE_SERVICES_PATH=chemin/vers/google-services.json (optionnel, copie auto Android)
 *
 * Usage : npm run setup:push:native
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseEnvFile, phase2EnvPath, upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const androidDest = path.join(root, 'moxt-react', 'android', 'app', 'google-services.json')
const iosDest = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'GoogleService-Info.plist')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function runSupabase(args, env) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  const runner = existsSync(supabaseJs) ? process.execPath : 'npx'
  const runnerArgs = existsSync(supabaseJs) ? [supabaseJs, ...args] : ['supabase', ...args]
  return (
    spawnSync(runner, runnerArgs, {
      cwd: root,
      stdio: 'inherit',
      shell: !existsSync(supabaseJs) && process.platform === 'win32',
      env,
    }).status ?? 1
  )
}

function resolveServiceAccountJson(vars) {
  const inline = vars.FCM_SERVICE_ACCOUNT_JSON || process.env.FCM_SERVICE_ACCOUNT_JSON
  if (inline?.trim().startsWith('{')) return inline.trim()

  const filePath = path.resolve(
    root,
    vars.FCM_SERVICE_ACCOUNT_PATH ||
      process.env.FCM_SERVICE_ACCOUNT_PATH ||
      'scripts/firebase-service-account.json',
  )
  if (!existsSync(filePath)) return ''
  return readFileSync(filePath, 'utf8').trim()
}

function maybeCopyGoogleServices(vars) {
  const src = vars.FCM_GOOGLE_SERVICES_PATH || process.env.FCM_GOOGLE_SERVICES_PATH
  if (!src) {
    if (existsSync(androidDest)) {
      log('Android', 'google-services.json déjà présent')
      return true
    }
    log('Android', 'google-services.json absent')
    console.log('  Téléchargez depuis Firebase Console → Paramètres projet → Android')
    console.log(`  Placez le fichier : ${androidDest}`)
    return false
  }

  const resolved = path.resolve(root, src)
  if (!existsSync(resolved)) {
    console.error(`\n✗ Fichier introuvable : ${resolved}`)
    return false
  }
  copyFileSync(resolved, androidDest)
  log('Android', `google-services.json copié → ${androidDest}`)
  return true
}

function checkIosPlist() {
  if (existsSync(iosDest)) {
    log('iOS', 'GoogleService-Info.plist présent')
    return true
  }
  log('iOS', 'GoogleService-Info.plist absent')
  console.log('  Firebase Console → iOS → téléchargez GoogleService-Info.plist')
  console.log(`  Placez le fichier : ${iosDest}`)
  console.log('  Xcode → Signing & Capabilities → Push Notifications')
  return false
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Push natif (FCM)')
  console.log('══════════════════════════════════════')

  const vars = parseEnvFile(phase2EnvPath)
  const serviceAccountJson = resolveServiceAccountJson(vars)

  if (!serviceAccountJson) {
    console.error('\n✗ Compte de service Firebase manquant.')
    console.error('  1. Firebase Console → Paramètres → Comptes de service → Générer une clé')
    console.error('  2. Enregistrez : scripts/firebase-service-account.json')
    console.error('  3. Ajoutez dans scripts/phase2.env :')
    console.error('       FCM_SERVICE_ACCOUNT_PATH=scripts/firebase-service-account.json')
    process.exit(1)
  }

  let projectId = ''
  try {
    projectId = JSON.parse(serviceAccountJson).project_id || ''
  } catch {
    console.error('\n✗ JSON compte de service invalide.')
    process.exit(1)
  }

  const androidOk = maybeCopyGoogleServices(vars)
  const iosOk = checkIosPlist()

  const supabaseEnv = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN:
      process.env.SUPABASE_ACCESS_TOKEN || vars.SUPABASE_ACCESS_TOKEN || '',
  }
  if (!supabaseEnv.SUPABASE_ACCESS_TOKEN) {
    console.error('\n✗ SUPABASE_ACCESS_TOKEN manquant.')
    process.exit(1)
  }

  log('Supabase', `secret FCM + deploy send-push (${projectId})`)
  if (runSupabase(['link', '--project-ref', projectRef, '--yes'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  if (
    runSupabase(
      [
        'secrets',
        'set',
        `FCM_SERVICE_ACCOUNT_JSON=${serviceAccountJson}`,
        `FCM_PROJECT_ID=${projectId}`,
      ],
      supabaseEnv,
    ) !== 0
  ) {
    process.exit(1)
  }

  if (runSupabase(['functions', 'deploy', 'send-push', '--no-verify-jwt'], supabaseEnv) !== 0) {
    process.exit(1)
  }

  upsertPhase2Env({ FCM_PROJECT_ID: projectId })

  console.log('\n══════════════════════════════════════')
  console.log('  Push natif configuré (serveur)')
  console.log('══════════════════════════════════════')
  console.log(`  Projet FCM : ${projectId}`)
  console.log(`  Android client : ${androidOk ? 'OK' : 'à compléter'}`)
  console.log(`  iOS client     : ${iosOk ? 'OK' : 'à compléter'}`)
  console.log('\n  Build natif prod : npm run web:cap:prod:sync')
  console.log('  Diagnostic       : npm run check:push')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
