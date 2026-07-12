#!/usr/bin/env node
/**
 * Prépare le déploiement GitHub Actions → Yandex Object Storage + CDN.
 *
 * Crée un compte de service dédié, les rôles IAM et une clé JSON
 * à enregistrer comme secret GitHub YC_SA_JSON.
 *
 * Usage : npm run setup:github-yandex
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { folderId, ycJson, ycRun } from './lib/yandex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const saName = process.env.MOXT_GITHUB_SA_NAME || 'moxt-github-deploy'
const keyPath = path.join(root, 'scripts', 'github-deploy-sa.json')
const s3KeyPath = path.join(root, 'scripts', 'github-deploy-s3-keys.json')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function bindRole(folder, saId, role) {
  const { code, stderr, stdout } = ycRun([
    'resource-manager',
    'folder',
    'add-access-binding',
    folder,
    '--role',
    role,
    '--service-account-id',
    saId,
  ])
  if (code !== 0 && !String(stderr || stdout).toLowerCase().includes('already')) {
    throw new Error(`Rôle ${role} : ${stderr || stdout}`)
  }
}

function ensureServiceAccount(folder) {
  const list = ycJson('iam', 'service-account', 'list', '--folder-id', folder)
  const accounts = Array.isArray(list) ? list : []
  const existing = accounts.find((a) => a.name === saName)
  if (existing) {
    log('Compte de service existant', `${saName} (${existing.id})`)
    return existing.id
  }
  log('Création compte de service', saName)
  const created = ycJson(
    'iam',
    'service-account',
    'create',
    '--name',
    saName,
    '--folder-id',
    folder,
    '--description',
    'MOXT — déploiement GitHub Actions',
  )
  return created.id
}

function ensureRoles(folder, saId) {
  log('Rôles IAM', 'storage.editor + cdn.editor')
  bindRole(folder, saId, 'storage.editor')
  bindRole(folder, saId, 'cdn.editor')
}

function createAuthorizedKey(saId) {
  log('Clé autorisée (JSON)', keyPath)
  mkdirSync(path.dirname(keyPath), { recursive: true })
  const { code, stderr, stdout } = ycRun([
    'iam',
    'key',
    'create',
    '--service-account-id',
    saId,
    '--output',
    keyPath,
    '--description',
    'MOXT GitHub Actions deploy',
  ])
  if (code !== 0) {
    throw new Error(`Création clé IAM : ${stderr || stdout}`)
  }
  if (!existsSync(keyPath)) {
    throw new Error('Fichier clé IAM introuvable après création.')
  }
  return JSON.parse(readFileSync(keyPath, 'utf8'))
}

function ensureS3AccessKey(saId) {
  if (existsSync(s3KeyPath)) {
    try {
      const existing = JSON.parse(readFileSync(s3KeyPath, 'utf8'))
      if (existing?.access_key?.key_id && existing?.secret) {
        log('Clé S3 statique existante', s3KeyPath)
        return existing
      }
    } catch {
      // recreate below
    }
  }

  log('Clé S3 statique (upload natif)', s3KeyPath)
  const created = ycJson('iam', 'access-key', 'create', '--service-account-id', saId, '--description', 'MOXT GitHub Actions S3 upload')
  if (!created?.access_key?.key_id || !created?.secret) {
    throw new Error('Création clé S3 statique impossible.')
  }
  mkdirSync(path.dirname(s3KeyPath), { recursive: true })
  writeFileSync(s3KeyPath, JSON.stringify(created, null, 2), 'utf8')
  return created
}

function detectCdnResourceId() {
  if (process.env.MOXT_CDN_RESOURCE_ID) return process.env.MOXT_CDN_RESOURCE_ID
  const list = ycJson('cdn', 'resource', 'list')
  const resources = Array.isArray(list) ? list : list?.resources || []
  const match = resources.find((r) =>
  (r.active_domain || r.cname || '').includes('moxtapp'),
  )
  return match?.id || ''
}

const folder = folderId()
if (!folder) {
  console.error('\n✗ folder-id Yandex introuvable. Lancez : yc init')
  process.exit(1)
}

log('Dossier Yandex', folder)
const saId = ensureServiceAccount(folder)
ensureRoles(folder, saId)
createAuthorizedKey(saId)
ensureS3AccessKey(saId)

const cdnId = detectCdnResourceId()
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'

console.log('\n══════════════════════════════════════════════════════════')
console.log('  GitHub — secrets à configurer')
console.log('══════════════════════════════════════════════════════════')
console.log('\n  Repo → Settings → Secrets and variables → Actions → New repository secret\n')
console.log('  YC_SA_JSON')
console.log(`    Contenu de : ${keyPath}`)
console.log('    (copier tout le fichier JSON)\n')
console.log('  VITE_SUPABASE_URL')
console.log('    https://rbvqfkccbkwjxkvpnwqn.supabase.co\n')
console.log('  VITE_SUPABASE_ANON_KEY')
console.log('    Clé anon Supabase (Dashboard → Project Settings → API)\n')
console.log('  MOXT_YC_S3_ACCESS_KEY_ID')
console.log(`    Contenu de : ${s3KeyPath} → access_key.key_id\n`)
console.log('  MOXT_YC_S3_SECRET_ACCESS_KEY')
console.log(`    Contenu de : ${s3KeyPath} → secret\n`)
if (cdnId) {
  console.log('  MOXT_CDN_RESOURCE_ID  (variable repo — purge cache après deploy)')
  console.log(`    ${cdnId}\n`)
}
console.log('  Variable optionnelle (Repository variables) :')
console.log(`    MOXT_YC_BUCKET = ${bucket}\n`)
console.log('  Ensuite : git push sur main → workflow deploy-yandex.yml\n')
console.log('  Automatique : $env:GITHUB_TOKEN="ghp_..." ; npm run setup:github-secrets\n')
console.log('  ⚠  Ne commitez pas github-deploy-sa.json ni github-deploy-s3-keys.json (déjà dans .gitignore)\n')

if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
  log('Configuration GitHub Actions', 'GITHUB_TOKEN détecté')
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'setup-github-secrets.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  process.exit(result.status ?? 1)
}
