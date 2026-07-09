#!/usr/bin/env node
/**
 * Active le SMTP Postbox sur Supabase + pousse les modèles d’e-mail.
 * Usage : npm run setup:smtp
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const projectRef = 'rbvqfkccbkwjxkvpnwqn'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
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

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
  })
  return result.status ?? 1
}

function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  SMTP Postbox + modèles e-mail')
  console.log('══════════════════════════════════════')

  if (!existsSync(envPath)) {
    console.error('\n✗ scripts/phase2.env introuvable.')
    console.error('  Lancez : npm run setup:yandex-provision')
    process.exit(1)
  }

  const vars = parseEnvFile(envPath)
  for (const key of ['MOXT_POSTBOX_SMTP_USER', 'MOXT_POSTBOX_SMTP_PASS', 'MOXT_POSTBOX_FROM']) {
    if (!vars[key]) {
      console.error(`\n✗ ${key} manquant dans scripts/phase2.env`)
      process.exit(1)
    }
  }

  log('Supabase', 'liaison projet')
  if (run('npx', ['supabase', 'link', '--project-ref', projectRef, '--yes'], process.env) !== 0) {
    process.exit(1)
  }

  log('Config Auth', 'SMTP Postbox + templates MOXT')
  const pushEnv = {
    ...process.env,
    MOXT_POSTBOX_SMTP_USER: vars.MOXT_POSTBOX_SMTP_USER,
    MOXT_POSTBOX_SMTP_PASS: vars.MOXT_POSTBOX_SMTP_PASS,
    MOXT_POSTBOX_FROM: vars.MOXT_POSTBOX_FROM,
  }
  if (run('npx', ['supabase', 'config', 'push', '--yes'], pushEnv) !== 0) {
    process.exit(1)
  }

  console.log('\n══════════════════════════════════════')
  console.log('  SMTP personnalisé activé')
  console.log('══════════════════════════════════════')
  console.log('\n  Dashboard → Authentication → Email Templates')
  console.log('  Vous pouvez maintenant modifier sujets et corps.')
  console.log(`\n  Expéditeur : ${vars.MOXT_POSTBOX_FROM}`)
}

main()
