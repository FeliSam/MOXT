#!/usr/bin/env node
/**
 * Configure le profil Yandex CLI en local (Windows / macOS / Linux).
 *
 * Usage :
 *   npm run setup:yc
 *   yc init                    (si aucune clé locale — compte Yandex OAuth)
 *
 * Priorité :
 *   1. Profil default (après yc init — OAuth, droits complets)
 *   2. YC_OAUTH_TOKEN / YC_TOKEN
 *   3. scripts/moxt-auth-yc.json
 *   4. scripts/github-deploy-sa.json (CDN + Storage seulement)
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureYc, ycRun } from './lib/yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const profile = process.env.MOXT_YC_PROFILE || 'moxt'
const folderId = process.env.MOXT_YC_FOLDER_ID || 'b1gmns3k9udjtgk89c9i'
const authKeyPath = path.join(root, 'scripts', 'moxt-auth-yc.json')
const deployKeyPath = path.join(root, 'scripts', 'github-deploy-sa.json')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function runYc(args) {
  return ycRun(args, { inherit: false })
}

function profileNames() {
  const { code, stdout } = runYc(['config', 'profile', 'list'])
  if (code !== 0) return []
  return stdout.split(/\r?\n/).map((line) => line.replace(/\s+ACTIVE$/, '').trim()).filter(Boolean)
}

function activateProfile(name) {
  const activated = runYc(['config', 'profile', 'activate', name])
  if (activated.code !== 0) {
    throw new Error(activated.stderr || activated.stdout || `impossible d’activer ${name}`)
  }
}

function readActiveConfig() {
  const list = runYc(['config', 'list'])
  if (list.code !== 0) return ''
  return list.stdout || ''
}

function profileIsUsable(configText) {
  if (!configText || configText.trim() === '{}') return false
  const hasAuth =
    /^token:/m.test(configText) ||
    /^subject-id:/m.test(configText) ||
    /^service-account-key:/m.test(configText)
  return hasAuth
}

function ensureProfile(name) {
  const names = profileNames()
  if (!names.includes(name)) {
    const created = runYc(['config', 'profile', 'create', name])
    if (created.code !== 0 && !String(created.stderr || created.stdout).includes('already')) {
      throw new Error(created.stderr || created.stdout || `impossible de créer le profil ${name}`)
    }
  }
  activateProfile(name)
}

function tryExistingOAuthProfile() {
  const names = profileNames()
  for (const name of ['default', profile]) {
    if (!names.includes(name)) continue
    activateProfile(name)
    const config = readActiveConfig()
    if (!profileIsUsable(config)) continue
    const isOAuth = /^token:/m.test(config) || /^subject-id:/m.test(config)
    if (!isOAuth) continue
    if (!/^folder-id:/m.test(config)) {
      runYc(['config', 'set', 'folder-id', folderId])
    }
    return { profile: name, label: `${name} (OAuth yc init)` }
  }
  return null
}

function configureFromKey(keyPath, label, targetProfile) {
  ensureProfile(targetProfile)
  const set = runYc(['config', 'set', 'service-account-key', keyPath])
  if (set.code !== 0) throw new Error(set.stderr || set.stdout)
  runYc(['config', 'set', 'folder-id', folderId])
  return { profile: targetProfile, label }
}

function configureFromToken() {
  const token = (process.env.YC_OAUTH_TOKEN || process.env.YC_TOKEN || '').trim()
  ensureProfile(profile)
  const set = runYc(['config', 'set', 'token', token])
  if (set.code !== 0) throw new Error(set.stderr || set.stdout)
  runYc(['config', 'set', 'folder-id', folderId])
  return { profile, label: 'YC_OAUTH_TOKEN' }
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  Yandex CLI — configuration locale')
  console.log('══════════════════════════════════════')

  ensureYc()

  let selected = tryExistingOAuthProfile()
  if (!selected) {
    const token = (process.env.YC_OAUTH_TOKEN || process.env.YC_TOKEN || '').trim()
    if (token) {
      log('Authentification', 'YC_OAUTH_TOKEN')
      selected = configureFromToken()
    } else if (existsSync(authKeyPath)) {
      log('Authentification', 'moxt-auth-yc.json')
      selected = configureFromKey(authKeyPath, 'moxt-auth-yc.json', profile)
    } else if (existsSync(deployKeyPath)) {
      log('Authentification', 'github-deploy-sa.json')
      selected = configureFromKey(deployKeyPath, 'github-deploy-sa.json', profile)
    }
  } else {
    log('Profil existant', selected.label)
  }

  if (!selected) {
    console.error('\n✗ Aucune authentification Yandex trouvée.')
    console.error('\n  Lancez une fois :')
    console.error('    yc init')
    console.error('    → cloud MOXT, dossier b1gmns3k9udjtgk89c9i')
    console.error('    npm run setup:yc')
    process.exit(1)
  }

  const check = readActiveConfig()
  if (!profileIsUsable(check)) {
    throw new Error('Profil Yandex vide après configuration.')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Profil Yandex configuré')
  console.log('══════════════════════════════════════')
  console.log(check)

  if (selected.label.includes('github-deploy')) {
    console.log('\n  ⚠ Clé déploiement GitHub : CDN + Storage seulement.')
    console.log('  Pour Postbox/DNS : yc init puis npm run setup:yc')
  } else {
    console.log('\n  Lancez : npm run setup:postbox')
    console.log('           npm run setup:yandex-cdn')
    console.log('           npm run setup:yandex-provision')
  }
}

main()
