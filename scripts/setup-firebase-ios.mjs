#!/usr/bin/env node
/**
 * Crée / récupère l’app Firebase iOS (com.moxt.app) et télécharge GoogleService-Info.plist.
 *
 * Usage :
 *   npm run setup:firebase:ios
 *   npm run setup:firebase:ios -- --project=blog-post-3bcea
 *
 * Le fichier est gitignoré (comme google-services.json Android).
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseEnvFile, phase2EnvPath } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = 'com.moxt.app'
const DISPLAY_NAME = 'MOXT'
const iosDest = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'GoogleService-Info.plist')
const firebaseBin = path.join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')

function parseArg(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length).trim() : ''
}

function runFirebase(args) {
  const hasLocal = existsSync(firebaseBin)
  const runner = hasLocal ? process.execPath : 'npx'
  const runnerArgs = hasLocal ? [firebaseBin, ...args] : ['--yes', 'firebase-tools', ...args]
  return spawnSync(runner, runnerArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: !hasLocal && process.platform === 'win32',
    env: process.env,
  })
}

function parseJsonBlob(text) {
  const start = text.indexOf('{')
  if (start < 0) return null
  try {
    return JSON.parse(text.slice(start))
  } catch {
    return null
  }
}

function resolveProjectId() {
  const fromArg = parseArg('project')
  if (fromArg) return fromArg
  const env = parseEnvFile(phase2EnvPath)
  if (env.FCM_PROJECT_ID) return env.FCM_PROJECT_ID
  const androidGs = path.join(root, 'moxt-react', 'android', 'app', 'google-services.json')
  if (existsSync(androidGs)) {
    try {
      return JSON.parse(readFileSync(androidGs, 'utf8'))?.project_info?.project_id || ''
    } catch {
      return ''
    }
  }
  return ''
}

function listIosApps(projectId) {
  const res = runFirebase(['apps:list', 'IOS', '--project', projectId, '--json'])
  const data = parseJsonBlob(`${res.stdout || ''}\n${res.stderr || ''}`)
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data)) return data
  return []
}

function findMoxtIos(apps) {
  return (
    apps.find((app) => String(app?.bundleId || '') === PACKAGE_NAME) ||
    apps.find((app) => String(app?.displayName || '').toUpperCase().includes('MOXT')) ||
    null
  )
}

function appIdOf(app) {
  return app?.appId || (typeof app?.name === 'string' ? app.name.split('/').pop() : '') || ''
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — Firebase iOS (Push / FCM)')
  console.log('══════════════════════════════════════')

  const projectId = resolveProjectId()
  if (!projectId) {
    console.error('\n✗ Projet Firebase introuvable. Passez --project=ID ou FCM_PROJECT_ID.')
    process.exit(1)
  }
  console.log(`\n▸ Projet : ${projectId}`)

  let apps = listIosApps(projectId)
  let app = findMoxtIos(apps)
  if (!app) {
    console.log(`\n▸ Création app iOS ${PACKAGE_NAME}`)
    const created = runFirebase([
      'apps:create',
      'IOS',
      DISPLAY_NAME,
      '--bundle-id',
      PACKAGE_NAME,
      '--project',
      projectId,
      '--json',
    ])
    const payload = parseJsonBlob(`${created.stdout || ''}\n${created.stderr || ''}`)
    if (payload?.result?.appId || payload?.appId) {
      app = payload.result || payload
    } else {
      apps = listIosApps(projectId)
      app = findMoxtIos(apps)
    }
  }

  if (!app) {
    console.error('\n✗ Impossible de créer / trouver l’app iOS.')
    process.exit(1)
  }

  const appId = appIdOf(app)
  console.log(`\n▸ App iOS : ${appId}`)
  console.log(`\n▸ Téléchargement GoogleService-Info.plist`)
  const cfg = runFirebase([
    'apps:sdkconfig',
    'IOS',
    appId,
    '-o',
    iosDest,
    '--project',
    projectId,
  ])
  if ((cfg.status ?? 1) !== 0 || !existsSync(iosDest)) {
    console.error(cfg.stderr || cfg.stdout || 'sdkconfig échoué')
    process.exit(1)
  }

  const body = readFileSync(iosDest, 'utf8')
  const bundleOk = body.includes(`<string>${PACKAGE_NAME}</string>`)
  console.log(`\n✓ Fichier : ${iosDest}`)
  console.log(`  Bundle ID ${bundleOk ? 'OK' : '⚠ à vérifier'}`)
  console.log('\nProchaines étapes (Mac / Apple Developer) :')
  console.log('  1. Apple Developer → Identifiers → Push Notifications pour com.moxt.app')
  console.log('  2. Clé APNs (.p8) → Firebase Console → Cloud Messaging → Apple')
  console.log('  3. Xcode → Signing → Push Notifications + Background Modes')
  console.log('  4. npm run setup:push:native  (secrets serveur FCM)')
  console.log('  5. npm run check:ios-store\n')
}

main()
