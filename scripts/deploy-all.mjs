#!/usr/bin/env node
/**
 * Pipeline production MOXT — git push, migrations, Supabase (parallèle), site Yandex.
 *
 *   npm run deploy:all
 *   npm run moxt -- deploy --parallel --purge-cdn
 *
 * Options :
 *   --push           git push origin HEAD (si commits en avance)
 *   --no-push        ignorer git push
 *   --parallel       déploie smsc / admin / push en parallèle (défaut)
 *   --sequential     déploiement Supabase séquentiel
 *   --skip-migrate   sauter db:push
 *   --skip-supabase  sauter smsc, admin-promote, push
 *   --skip-web       sauter web:deploy:yandex
 *   --purge-cdn      invalider le cache CDN après upload
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TaskQueue } from './lib/taskQueue.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const argv = process.argv.slice(2)

const wantPush =
  process.env.MOXT_DEPLOY_PUSH === '1' ||
  (argv.includes('--push') && !argv.includes('--no-push'))
const parallel = !argv.includes('--sequential')
const skipMigrate =
  process.env.MOXT_SKIP_MIGRATE === '1' || argv.includes('--skip-migrate')
const skipSupabase =
  process.env.MOXT_SKIP_SUPABASE === '1' || argv.includes('--skip-supabase')
const skipWeb = process.env.MOXT_SKIP_DEPLOY === '1' || argv.includes('--skip-web')
const purgeCdn = argv.includes('--purge-cdn')

function log(step, title, detail = '') {
  console.log(`\n[${step}] ${title}${detail ? `\n      ${detail}` : ''}`)
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

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
    ...options,
  })
  return result.status ?? 1
}

function runNpm(script, extraArgs = []) {
  return run('npm', ['run', script, ...extraArgs])
}

function runScript(scriptName, extraArgs = []) {
  return run(process.execPath, [path.join(root, 'scripts', scriptName), ...extraArgs])
}

function gitAheadCount() {
  const result = spawnSync('git', ['rev-list', '--count', 'HEAD', '^@{upstream}'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) return 0
  const count = Number.parseInt(String(result.stdout).trim(), 10)
  return Number.isFinite(count) ? count : 0
}

function maybeGitPush() {
  if (!wantPush) {
    log('0/5', 'Git push — ignoré', 'ajoutez --push ou MOXT_DEPLOY_PUSH=1')
    return true
  }

  const ahead = gitAheadCount()
  if (ahead === 0) {
    log('0/5', 'Git push — rien à pousser (ou déjà poussé)')
    return true
  }

  log('0/5', 'Git push', `${ahead} commit(s) en avance`)
  return run('git', ['push', 'origin', 'HEAD']) === 0
}

async function deploySupabaseParallel(phase2) {
  const tasks = [
    {
      id: 'smsc',
      label: 'SMSC + send-sms',
      run: () => {
        if (runNpm('setup:smsc') !== 0) throw new Error('setup:smsc')
      },
    },
    {
      id: 'admin',
      label: 'admin-promote-role',
      run: () => {
        if (runNpm('setup:admin-promote') !== 0) throw new Error('setup:admin-promote')
      },
    },
  ]

  const hasVapid =
    (phase2.VAPID_PUBLIC_KEY && phase2.VAPID_PRIVATE_KEY) ||
    (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  if (hasVapid) {
    tasks.push({
      id: 'push',
      label: 'send-push + VAPID',
      run: () => {
        if (runNpm('setup:push') !== 0) throw new Error('setup:push')
      },
    })
  }

  const hasFcm =
    phase2.FCM_SERVICE_ACCOUNT_PATH ||
    phase2.FCM_SERVICE_ACCOUNT_JSON ||
    process.env.FCM_SERVICE_ACCOUNT_PATH
  if (hasFcm) {
    tasks.push({
      id: 'push-native',
      label: 'FCM Android/iOS',
      run: () => {
        if (runNpm('setup:push:native') !== 0) throw new Error('setup:push:native')
      },
    })
  }

  log('2/5', `Supabase (${tasks.length} tâches en parallèle)`)
  const queue = new TaskQueue({ concurrency: tasks.length, stopOnError: true })
  const { ok, errors } = await queue.runAll(tasks)
  if (!ok) {
    for (const err of errors) console.error(`  ✗ ${err.label}: ${err.message}`)
    return false
  }
  return true
}

async function deploySupabaseSequential(phase2) {
  log('2/5', 'SMSC', 'npm run setup:smsc')
  if (runNpm('setup:smsc') !== 0) return false
  log('3/5', 'Admin', 'npm run setup:admin-promote')
  if (runNpm('setup:admin-promote') !== 0) return false
  const hasVapid =
    (phase2.VAPID_PUBLIC_KEY && phase2.VAPID_PRIVATE_KEY) ||
    (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  if (hasVapid) {
    log('4/5', 'Push', 'npm run setup:push')
    if (runNpm('setup:push') !== 0) return false
  }
  return true
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — déploiement complet')
  console.log(`  mode : ${parallel ? 'parallèle' : 'séquentiel'}`)
  console.log('══════════════════════════════════════')

  const phase2 = parseEnvFile(envPath)

  if (!maybeGitPush()) process.exit(1)

  if (!skipMigrate) {
    log('1/5', 'Migrations Supabase', 'npm run db:push')
    if (runNpm('db:push') !== 0) process.exit(1)
  } else {
    log('1/5', 'Migrations — ignorées')
  }

  if (!skipSupabase) {
    process.env.MOXT_SKIP_DB_PUSH = '1'
    const ok = parallel
      ? await deploySupabaseParallel(phase2)
      : await deploySupabaseSequential(phase2)
    delete process.env.MOXT_SKIP_DB_PUSH
    if (!ok) process.exit(1)
  } else {
    log('2/5', 'Supabase — ignoré')
  }

  if (!skipWeb) {
    const deployArgs = []
    if (purgeCdn || phase2.MOXT_CDN_RESOURCE_ID) deployArgs.push('--purge-cdn')
    log('5/5', 'Site Yandex', 'build + upload')
    if (runScript('deploy-yandex.mjs', deployArgs) !== 0) process.exit(1)
  } else {
    log('5/5', 'Site Yandex — ignoré')
  }

  log('✓', 'Terminé', 'https://moxtapp.ru')
  console.log('\n══════════════════════════════════════')
  console.log('  Déploiement complet terminé')
  console.log('══════════════════════════════════════\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
