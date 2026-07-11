#!/usr/bin/env node
/**
 * Configure automatiquement les secrets et variables GitHub Actions.
 *
 * Prérequis :
 *   GITHUB_TOKEN ou GH_TOKEN — PAT avec permissions repo + actions (write)
 *   npm run setup:github-yandex  (génère scripts/github-deploy-sa.json)
 *
 * Usage : npm run setup:github-secrets
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import sodium from 'tweetsodium'
import { findCdnResource } from './lib/yandex-cdn.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const saKeyPath = path.join(root, 'scripts', 'github-deploy-sa.json')
const envProdPath = path.join(root, 'moxt-react', '.env.production')

let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

function detectCdnResourceId() {
  if (process.env.MOXT_CDN_RESOURCE_ID) return process.env.MOXT_CDN_RESOURCE_ID
  try {
    const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
    const found = findCdnResource(domain, `www.${domain}`)
    if (found?.id) return found.id
  } catch {
    // yc indisponible — fallback ci-dessous
  }
  return 'bc8rz327qbtedt3vbafl'
}

const cdnResourceId = detectCdnResourceId()
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function run(bin, args, { inherit = false } = {}) {
  return spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: inherit ? 'inherit' : 'pipe',
  })
}

function findGh() {
  if (run('gh', ['--version']).status === 0) return 'gh'
  const candidates = [
    'C:\\Program Files\\GitHub CLI\\gh.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'GitHub CLI', 'gh.exe'),
    path.join(process.env.ProgramFiles || '', 'GitHub CLI', 'gh.exe'),
  ]
  return candidates.find((candidate) => existsSync(candidate)) || null
}

function getGhToken(ghBin) {
  const current = run(ghBin, ['auth', 'token'])
  if (current.status === 0 && current.stdout?.trim()) {
    return current.stdout.trim()
  }

  log('Connexion GitHub', 'ouverture du navigateur (une seule fois)')
  console.log('  Si gh n est pas installe : https://cli.github.com/\n')
  const login = run(
    ghBin,
    [
      'auth',
      'login',
      '--hostname',
      'github.com',
      '--git-protocol',
      'https',
      '--scopes',
      'repo,workflow',
      '--web',
    ],
    { inherit: true },
  )
  if (login.status !== 0) return null

  const after = run(ghBin, ['auth', 'token'])
  return after.status === 0 ? after.stdout?.trim() || null : null
}

function resolveToken() {
  if (token) return token
  const ghBin = findGh()
  if (!ghBin) return null
  return getGhToken(ghBin)
}

function parseEnvFile(filePath) {
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

function gitRepo() {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const url = (result.stdout || '').trim()
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i)
  if (!match) {
    throw new Error(`Remote GitHub introuvable (origin = ${url || 'vide'})`)
  }
  return { owner: match[1], repo: match[2] }
}

function apiHeaders(extra = {}) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  }
}

async function ghRequest(method, apiPath, body) {
  const { owner, repo } = gitRepo()
  const url = `https://api.github.com/repos/${owner}/${repo}${apiPath}`
  const res = await fetch(url, {
    method,
    headers: apiHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg = typeof data === 'object' ? data?.message || JSON.stringify(data) : data
    throw new Error(`GitHub API ${method} ${apiPath} → ${res.status} ${msg}`)
  }
  return data
}

async function setSecret(name, value) {
  const { key, key_id } = await ghRequest('GET', '/actions/secrets/public-key')
  const encryptedBytes = sodium.seal(Buffer.from(value, 'utf8'), Buffer.from(key, 'base64'))
  await ghRequest('PUT', `/actions/secrets/${name}`, {
    encrypted_value: Buffer.from(encryptedBytes).toString('base64'),
    key_id,
  })
  console.log(`  ✓ secret ${name}`)
}

async function setSecretBase64(name, filePath) {
  const b64 = Buffer.from(readFileSync(filePath, 'utf8'), 'utf8').toString('base64')
  await setSecret(name, b64)
}

async function setVariable(name, value) {
  const { owner, repo } = gitRepo()
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/variables/${name}`
  const patch = await fetch(url, {
    method: 'PATCH',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, value }),
  })
  if (patch.status === 404) {
    await ghRequest('POST', '/actions/variables', { name, value })
  } else if (!patch.ok) {
    const text = await patch.text()
    throw new Error(`Variable ${name} → ${patch.status} ${text}`)
  }
  console.log(`  ✓ variable ${name}`)
}

async function main() {
  token = resolveToken()
  if (!token) {
    console.error('\n✗ Connexion GitHub requise.')
    console.error('  Option A (recommandee) : installez GitHub CLI puis relancez')
    console.error('    https://cli.github.com/')
    console.error('    Le script ouvrira le navigateur automatiquement.')
    console.error('  Option B : creez un PAT manuellement')
    console.error('    https://github.com/settings/tokens  (scopes repo + workflow)')
    console.error('    Puis : $env:GITHUB_TOKEN="ghp_..." ; npm run setup:github-secrets')
    process.exit(1)
  }

  if (!existsSync(saKeyPath)) {
    console.error(`\n✗ ${saKeyPath} introuvable. Lancez d’abord : npm run setup:github-yandex`)
    process.exit(1)
  }

  const envProd = parseEnvFile(envProdPath)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || envProd.VITE_SUPABASE_URL
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || envProd.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY introuvables (moxt-react/.env.production)')
  }

  const repo = gitRepo()
  log('Repository GitHub', `${repo.owner}/${repo.repo}`)
  log('Secrets Actions')

  await setSecretBase64('YC_SA_JSON_B64', saKeyPath)
  await setSecret('YC_SA_JSON', readFileSync(saKeyPath, 'utf8'))
  await setSecret('VITE_SUPABASE_URL', supabaseUrl)
  await setSecret('VITE_SUPABASE_ANON_KEY', supabaseAnon)

  log('Variables Actions')
  await setVariable('MOXT_CDN_RESOURCE_ID', cdnResourceId)
  await setVariable('MOXT_YC_BUCKET', bucket)

  console.log('\n══════════════════════════════════════')
  console.log('  GitHub Actions configuré')
  console.log('══════════════════════════════════════')
  console.log('\n  Push sur main → déploiement automatique Yandex')
  console.log('  Test manuel : Actions → Deploy — Yandex Cloud → Run workflow\n')
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
