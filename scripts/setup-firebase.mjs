#!/usr/bin/env node
/**
 * Connecte le Firebase CLI et prépare FCM pour Capacitor Android (com.moxt.app).
 *
 * Usage :
 *   npm run firebase:login          # navigateur (une fois)
 *   npm run setup:firebase          # app Android + google-services.json
 *   npm run setup:firebase -- --project=mon-projet-id
 *
 * Ensuite (compte de service + secrets Supabase) :
 *   Placez scripts/firebase-service-account.json
 *   npm run setup:push:native
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseEnvFile, phase2EnvPath, upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = 'com.moxt.app'
const DISPLAY_NAME = 'MOXT'
const androidDest = path.join(root, 'moxt-react', 'android', 'app', 'google-services.json')
const firebasercPath = path.join(root, '.firebaserc')
const firebaseJsonPath = path.join(root, 'firebase.json')
const firebaseBin = path.join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function parseArg(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length).trim() : ''
}

function runFirebase(args, { inherit = true, capture = false } = {}) {
  const hasLocal = existsSync(firebaseBin)
  const runner = hasLocal ? process.execPath : 'npx'
  const runnerArgs = hasLocal ? [firebaseBin, ...args] : ['--yes', 'firebase-tools', ...args]

  const result = spawnSync(runner, runnerArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: !hasLocal && process.platform === 'win32',
    stdio: inherit && !capture ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })

  return {
    ok: (result.status ?? 1) === 0,
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  }
}

function parseFirebaseJson(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const lines = text.split(/\r?\n/).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i])
      return parsed?.result !== undefined ? parsed.result : parsed
    } catch {
      /* try previous line */
    }
  }
  try {
    const parsed = JSON.parse(text)
    return parsed?.result !== undefined ? parsed.result : parsed
  } catch {
    return null
  }
}

function ensureFirebaseJson() {
  if (existsSync(firebaseJsonPath)) return
  writeFileSync(
    firebaseJsonPath,
    `${JSON.stringify(
      {
        // Projet lié pour apps FCM / Firebase CLI (pas d’Hosting MOXT).
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  log('firebase.json', 'créé (config CLI minimale)')
}

function readFirebasercProject() {
  if (!existsSync(firebasercPath)) return ''
  try {
    return JSON.parse(readFileSync(firebasercPath, 'utf8'))?.projects?.default || ''
  } catch {
    return ''
  }
}

function writeFirebaserc(projectId) {
  writeFileSync(
    firebasercPath,
    `${JSON.stringify({ projects: { default: projectId } }, null, 2)}\n`,
    'utf8',
  )
}

function isLoggedIn() {
  const res = runFirebase(['login:list', '--json'], { inherit: false, capture: true })
  const data = parseFirebaseJson(`${res.stdout}\n${res.stderr}`)
  const users = Array.isArray(data) ? data : data?.users || []
  return users.length > 0
}

function resolveProjectId(vars) {
  return (
    parseArg('project') ||
    process.env.FCM_PROJECT_ID ||
    vars.FCM_PROJECT_ID ||
    readFirebasercProject() ||
    ''
  )
}

function listAndroidApps() {
  const res = runFirebase(['apps:list', 'ANDROID', '--json'], { inherit: false, capture: true })
  const data = parseFirebaseJson(`${res.stdout}\n${res.stderr}`)
  if (!res.ok && !data) {
    console.error(res.stderr || res.stdout || 'Impossible de lister les apps Android Firebase.')
    return []
  }
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.apps)) return data.apps
  return []
}

function packageNameOf(app) {
  return (
    app?.packageName ||
    app?.androidApp?.packageName ||
    app?.platformAppId ||
    ''
  )
}

function findMoxtApp(apps) {
  return (
    apps.find((app) => String(packageNameOf(app)) === PACKAGE_NAME) ||
    apps.find((app) => String(app?.displayName || '').toUpperCase().includes('MOXT')) ||
    null
  )
}

function appIdOf(app) {
  if (app?.appId) return String(app.appId)
  if (typeof app?.name === 'string' && app.name.includes('/')) {
    return app.name.split('/').pop()
  }
  return ''
}

function downloadSdkConfig(appId) {
  mkdirSync(path.dirname(androidDest), { recursive: true })
  const tmp = `${androidDest}.download`
  const res = runFirebase(['apps:sdkconfig', 'ANDROID', appId, '-o', tmp], { inherit: true })
  if (!res.ok || !existsSync(tmp)) return false
  writeFileSync(androidDest, readFileSync(tmp, 'utf8'))
  try {
    unlinkSync(tmp)
  } catch {
    /* ignore */
  }
  return existsSync(androidDest)
}

function printServiceAccountHelp(projectId) {
  console.log('\n──────────────────────────────────────')
  console.log('  Compte de service (obligatoire serveur)')
  console.log('──────────────────────────────────────')
  console.log('  La CLI ne peut pas télécharger la clé privée automatiquement.')
  console.log('  1. Ouvrez :')
  console.log(
    `     https://console.firebase.google.com/project/${projectId || 'VOTRE_PROJET'}/settings/serviceaccounts/adminsdk`,
  )
  console.log('  2. « Générer une nouvelle clé privée »')
  console.log('  3. Enregistrez le fichier :')
  console.log('     scripts/firebase-service-account.json')
  console.log('  4. Puis :')
  console.log('     npm run setup:push:native')
  console.log('     npm run web:cap:prod:sync')
  console.log('     npm run check:push')
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Firebase CLI → FCM Android')
  console.log('══════════════════════════════════════')

  if (!existsSync(firebaseBin)) {
    console.error('\n✗ firebase-tools manquant. Lancez : npm install')
    process.exit(1)
  }

  ensureFirebaseJson()
  const vars = parseEnvFile(phase2EnvPath)

  if (!isLoggedIn()) {
    console.error('\n✗ Firebase CLI non connecté.')
    console.error('  Lancez : npm run firebase:login')
    console.error('  (navigateur Google → autorisez Firebase CLI)')
    process.exit(1)
  }
  log('Auth', 'Firebase CLI connecté')

  const projectId = resolveProjectId(vars)
  if (!projectId) {
    console.error('\n✗ ID projet Firebase manquant.')
    console.error('  Options :')
    console.error('    npm run setup:firebase -- --project=votre-projet-id')
    console.error('    ou FCM_PROJECT_ID=... dans scripts/phase2.env')
    console.error('\n  Liste des projets :')
    runFirebase(['projects:list'], { inherit: true })
    process.exit(1)
  }

  writeFirebaserc(projectId)
  log('Projet', projectId)
  if (!runFirebase(['use', projectId], { inherit: true }).ok) {
    console.error('\n✗ Impossible de sélectionner le projet. Vérifiez l’ID et les droits.')
    process.exit(1)
  }

  let apps = listAndroidApps()
  let app = findMoxtApp(apps)

  if (!app) {
    log('App Android', `création ${PACKAGE_NAME}`)
    const created = runFirebase(
      [
        'apps:create',
        'ANDROID',
        PACKAGE_NAME,
        `--display-name=${DISPLAY_NAME}`,
        `--project=${projectId}`,
      ],
      { inherit: true },
    )
    if (!created.ok) {
      console.error('\n✗ Création app Android échouée.')
      console.error('  Créez-la manuellement dans la Console Firebase (package com.moxt.app),')
      console.error('  puis relancez : npm run setup:firebase')
      process.exit(1)
    }
    apps = listAndroidApps()
    app = findMoxtApp(apps)
  } else {
    log('App Android', `${PACKAGE_NAME} déjà présente`)
  }

  const appId = appIdOf(app)
  if (!appId) {
    console.error('\n✗ Impossible de résoudre l’appId Android Firebase.')
    console.error('  Apps :', JSON.stringify(apps, null, 2))
    process.exit(1)
  }

  log('SDK config', `téléchargement google-services.json (${appId})`)
  if (!downloadSdkConfig(appId)) {
    console.error('\n✗ Téléchargement google-services.json échoué.')
    console.error('  Console → Paramètres projet → Votre app Android → Télécharger google-services.json')
    console.error(`  Placez-le : ${androidDest}`)
    process.exit(1)
  }
  log('Android', `google-services.json → ${androidDest}`)

  upsertPhase2Env({
    FCM_PROJECT_ID: projectId,
    FCM_GOOGLE_SERVICES_PATH: 'moxt-react/android/app/google-services.json',
    FCM_SERVICE_ACCOUNT_PATH: 'scripts/firebase-service-account.json',
  })

  const saPath = path.join(root, 'scripts', 'firebase-service-account.json')
  const hasSa =
    existsSync(saPath) ||
    Boolean(vars.FCM_SERVICE_ACCOUNT_JSON?.trim()?.startsWith('{')) ||
    (vars.FCM_SERVICE_ACCOUNT_PATH &&
      existsSync(path.resolve(root, vars.FCM_SERVICE_ACCOUNT_PATH)))

  console.log('\n══════════════════════════════════════')
  console.log('  Client Android FCM prêt')
  console.log('══════════════════════════════════════')
  console.log(`  Projet     : ${projectId}`)
  console.log(`  Package    : ${PACKAGE_NAME}`)
  console.log(`  Config     : ${androidDest}`)

  if (hasSa) {
    console.log('\n  Compte de service détecté → npm run setup:push:native')
  } else {
    printServiceAccountHelp(projectId)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
