#!/usr/bin/env node
/**
 * Configuration production MOXT — Supabase + Netlify
 *
 * Usage :
 *   npm run setup:production
 *
 * Prérequis Netlify (une fois) :
 *   set NETLIFY_AUTH_TOKEN=xxx   (https://app.netlify.com/user/applications)
 *   set NETLIFY_SITE_ID=xxx      (Site settings → General → Site ID)
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envLocalPath = path.join(root, 'moxt-react', '.env.local')
const siteUrl = process.env.MOXT_SITE_URL || 'https://moxt.netlify.app'

function log(title, message = '') {
  console.log(`\n▸ ${title}${message ? `\n  ${message}` : ''}`)
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const vars = {}
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    ...options,
  })
  return result.status ?? 1
}

function runOrWarn(title, command, args) {
  const code = run(command, args)
  if (code !== 0) {
    log(`${title} — ignoré`, 'Historique migrations désynchronisé ou déjà appliqué. Vérifiez le dashboard Supabase.')
    return false
  }
  return true
}

async function syncNetlifyEnv(vars) {
  const token = process.env.NETLIFY_AUTH_TOKEN
  const siteId = process.env.NETLIFY_SITE_ID
  if (!token || !siteId) {
    log(
      'Netlify — configuration manuelle requise',
      'Ajoutez sur https://app.netlify.com → Site → Environment variables :\n' +
        `  VITE_SUPABASE_URL=${vars.VITE_SUPABASE_URL}\n` +
        `  VITE_SUPABASE_ANON_KEY=<copiez depuis moxt-react/.env.local>\n` +
        'Puis : Deploys → Trigger deploy → Clear cache and deploy site\n\n' +
        'Automatique : définissez NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID puis relancez npm run setup:production',
    )
    return false
  }

  const keys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']
  for (const key of keys) {
    const value = vars[key]
    if (!value) continue

    const res = await fetch(`https://api.netlify.com/api/v1/accounts/self/env/${key}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site_id: siteId,
        values: [{ value, context: 'all' }],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Erreur Netlify env ${key}: ${res.status} ${text}`)
      process.exit(1)
    }
    log(`Netlify ✓ ${key}`)
  }

  const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/builds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clear_cache: true }),
  })
  if (buildRes.ok) {
    log('Netlify ✓ redéploiement lancé (cache vidé)')
  } else {
    log('Netlify — redéploiement manuel', 'Deploys → Trigger deploy → Clear cache and deploy site')
  }
  return true
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — configuration production')
  console.log('══════════════════════════════════════')
  console.log(`  Site : ${siteUrl}`)

  const localEnv = parseEnvFile(envLocalPath)
  if (!localEnv.VITE_SUPABASE_URL) {
    console.error(`\n✗ Fichier introuvable ou incomplet : ${envLocalPath}`)
    process.exit(1)
  }

  log('Supabase — liaison projet MOXT')
  if (run('npx', ['supabase', 'link', '--project-ref', 'rbvqfkccbkwjxkvpnwqn', '--yes']) !== 0) {
    process.exit(1)
  }

  log('Supabase — URLs auth (site + redirects Netlify)')
  if (run('npx', ['supabase', 'config', 'push', '--yes']) !== 0) {
    process.exit(1)
  }

  log('Supabase — migrations SQL')
  runOrWarn('Migrations', 'npx', ['supabase', 'db', 'push', '--linked', '--yes'])

  await syncNetlifyEnv(localEnv)

  log('Terminé', `Vérifiez ${siteUrl} — la console ne doit plus afficher « mode simulé ».`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
