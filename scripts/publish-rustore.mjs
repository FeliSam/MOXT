/**
 * Publie l’APK (ou AAB) signé sur RuStore : brouillon → upload → moderation.
 *
 *   node scripts/publish-rustore.mjs
 *   node scripts/publish-rustore.mjs --aab
 *   node scripts/publish-rustore.mjs --apk=path --no-commit
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_RUSTORE_PACKAGE,
  fetchRustoreAuthToken,
  getRustoreConfig,
} from './lib/rustore.mjs'
import { loadPhase2Env, root } from './lib/env.mjs'

const API = 'https://public-api.rustore.ru/public/v1'

function parseArgs(argv) {
  const out = { commit: true }
  for (const arg of argv) {
    if (arg === '--aab') out.aab = true
    else if (arg === '--no-commit') out.commit = false
    else if (arg.startsWith('--apk=')) out.apk = arg.slice(6)
    else if (arg.startsWith('--aab=')) {
      out.aab = true
      out.aabPath = arg.slice(6)
    }
  }
  return out
}

async function rustoreJson(jwe, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Public-Token': jwe,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { res, json }
}

function failApi(step, json, status) {
  const detail = json.message || json.code || json.error || JSON.stringify(json).slice(0, 800)
  throw new Error(`${step} (HTTP ${status}): ${detail}`)
}

function versionIdFromCreate(json) {
  if (typeof json.body === 'number') return json.body
  if (json.body?.versionId) return json.body.versionId
  if (json.content?.versionId) return json.content.versionId
  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadPhase2Env()
  const cfg = getRustoreConfig(env)
  const packageName = cfg.packageName || DEFAULT_RUSTORE_PACKAGE

  const defaultApk = path.join(root, 'moxt-react/android/app/build/outputs/apk/release/app-release.apk')
  const defaultAab = path.join(root, 'moxt-react/android/app/build/outputs/bundle/release/app-release.aab')
  const filePath = args.aab
    ? path.resolve(root, args.aabPath || defaultAab)
    : path.resolve(root, args.apk || defaultApk)
  if (!existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath} — lancer npm run android:apk ou android:aab`)
  }
  const sizeMb = (statSync(filePath).size / (1024 * 1024)).toFixed(1)
  const pkg = JSON.parse(readFileSync(path.join(root, 'moxt-react/package.json'), 'utf8'))

  console.log(`▸ Auth RuStore (${packageName})`)
  const { jwe } = await fetchRustoreAuthToken(env)

  const listUrl = `${API}/application/${encodeURIComponent(packageName)}/version?versionStatuses=DRAFT&page=0&size=20`
  const listed = await rustoreJson(jwe, 'GET', listUrl)
  if (listed.json.code !== 'OK') failApi('Liste versions', listed.json, listed.res.status)
  const drafts = listed.json.body?.content || listed.json.body || []
  const draftRows = Array.isArray(drafts) ? drafts : []
  for (const row of draftRows) {
    const id = row.versionId ?? row.id
    if (!id) continue
    console.log(`▸ Suppression brouillon ${id}`)
    const del = await rustoreJson(
      jwe,
      'DELETE',
      `${API}/application/${encodeURIComponent(packageName)}/version/${id}`,
    )
    if (del.json.code !== 'OK') failApi('Delete draft', del.json, del.res.status)
  }

  console.log('▸ Création brouillon')
  const draftBody = {
    appType: 'MAIN',
    publishType: 'INSTANTLY',
    whatsNew: `MOXT ${pkg.version} (versionCode 14) — сборка RuStore.`,
    shortDescription: 'Переводы, посылки, маркетплейс и работа — диаспора Африка ↔ Россия',
    developerContacts: {
      email: 'support@moxtapp.ru',
      website: 'https://moxtapp.ru',
    },
  }
  const created = await rustoreJson(
    jwe,
    'POST',
    `${API}/application/${encodeURIComponent(packageName)}/version`,
    draftBody,
  )
  if (created.json.code !== 'OK') failApi('Create draft', created.json, created.res.status)
  const versionId = versionIdFromCreate(created.json)
  if (!versionId) throw new Error(`versionId manquant: ${JSON.stringify(created.json).slice(0, 500)}`)
  console.log(`  versionId ${versionId}`)

  const bytes = readFileSync(filePath)
  const blob = new Blob([bytes])
  const form = new FormData()
  form.append('file', blob, path.basename(filePath))

  const uploadPath = args.aab
    ? `${API}/application/${encodeURIComponent(packageName)}/version/${versionId}/aab`
    : `${API}/application/${encodeURIComponent(packageName)}/version/${versionId}/apk?servicesType=Unknown&isMainApk=true`

  console.log(`▸ Upload ${args.aab ? 'AAB' : 'APK'} (${sizeMb} Mo)`)
  const up = await fetch(uploadPath, {
    method: 'POST',
    headers: { 'Public-Token': jwe },
    body: form,
  })
  const upJson = await up.json().catch(() => ({}))
  if (!up.ok || upJson.code !== 'OK') failApi('Upload', upJson, up.status)
  console.log('  ✓ fichier envoyé')

  if (args.commit) {
    console.log('▸ Envoi en modération')
    const commit = await rustoreJson(
      jwe,
      'POST',
      `${API}/application/${encodeURIComponent(packageName)}/version/${versionId}/commit?priorityUpdate=0`,
    )
    if (commit.json.code !== 'OK') failApi('Commit', commit.json, commit.res.status)
    console.log('  ✓ soumis à RuStore')
  } else {
    console.log('  (commit ignoré — --no-commit)')
  }

  console.log(`✓ RuStore version ${versionId} (${pkg.version})`)
}

main().catch((error) => {
  console.error('✗', error.message || error)
  process.exit(1)
})
