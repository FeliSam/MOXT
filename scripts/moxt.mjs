#!/usr/bin/env node
/**
 * CLI MOXT — raccourcis dev / deploy / fix
 *
 *   npm run moxt -- help
 *   npm run ship -- -m "fix login"
 *   npm run go
 *   npm run fix
 *
 * Commandes :
 *   ship, go, cpd   commit + push + deploy (parallèle)
 *   deploy          deploy sans git
 *   fix             tests + checks en parallèle
 *   check-push      vérifie web + Capacitor push
 *   help
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TaskQueue } from './lib/taskQueue.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const command = (argv[0] || 'help').toLowerCase()

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function run(commandLine, args = [], options = {}) {
  const isGit = commandLine === 'git'
  const result = spawnSync(commandLine, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isGit ? false : process.platform === 'win32',
    env: process.env,
    ...options,
  })
  return result.status ?? 1
}

function runNode(script, args = []) {
  return run(process.execPath, [path.join(root, 'scripts', script), ...args])
}

function gitStatusPorcelain() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  return result.status === 0 ? String(result.stdout).trim() : ''
}

function parseMessageFlag() {
  const mIndex = argv.indexOf('-m')
  if (mIndex >= 0) {
    const rest = argv.slice(mIndex + 1).filter((a) => !a.startsWith('--'))
    if (rest.length) return rest.join(' ')
  }
  const msgIndex = argv.indexOf('--message')
  if (msgIndex >= 0) {
    const rest = argv.slice(msgIndex + 1).filter((a) => !a.startsWith('--'))
    if (rest.length) return rest.join(' ')
  }
  return ''
}

async function ship() {
  const message = parseMessageFlag() || process.env.MOXT_COMMIT_MSG || ''
  const dirty = gitStatusPorcelain()
  const skipCommit = argv.includes('--no-commit')

  console.log('\n══════════════════════════════════════')
  console.log('  MOXT ship — commit · push · deploy')
  console.log('══════════════════════════════════════')

  if (!skipCommit && dirty) {
    if (!message) {
      console.error('\n✗ Changements non commités. Ajoutez -m "message" ou MOXT_COMMIT_MSG.')
      process.exit(1)
    }
    log('Git commit', message)
    if (run('git', ['add', '-A']) !== 0) process.exit(1)
    if (run('git', ['commit', '-m', message]) !== 0) process.exit(1)
  } else if (!dirty) {
    log('Git commit', 'rien à committer')
  }

  log('Git push')
  if (run('git', ['push', 'origin', 'HEAD']) !== 0) process.exit(1)

  const deployArgs = ['--parallel', '--purge-cdn']
  if (argv.includes('--purge-cdn')) deployArgs.push('--purge-cdn')
  if (argv.includes('--skip-web')) deployArgs.push('--skip-web')
  if (argv.includes('--skip-supabase')) deployArgs.push('--skip-supabase')

  if (runNode('deploy-all.mjs', deployArgs) !== 0) process.exit(1)

  console.log('\n✓ Ship terminé — https://moxtapp.ru\n')
}

async function fix() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT fix — checks parallèles')
  console.log('══════════════════════════════════════')

  const queue = new TaskQueue({ concurrency: 4, stopOnError: false })
  const tasks = [
    {
      id: 'shared-test',
      label: 'Tests @moxt/shared',
      run: () => {
        if (run('npm', ['run', 'shared:test']) !== 0) throw new Error('shared:test échoué')
      },
    },
    {
      id: 'web-test',
      label: 'Tests moxt-react',
      run: () => {
        if (run('npm', ['run', 'web:test']) !== 0) throw new Error('web:test échoué')
      },
    },
    {
      id: 'check-site',
      label: 'check:site',
      run: () => {
        if (run('npm', ['run', 'check:site']) !== 0) throw new Error('check:site échoué')
      },
    },
    {
      id: 'check-smsc',
      label: 'check:smsc',
      run: () => {
        if (run('npm', ['run', 'check:smsc']) !== 0) throw new Error('check:smsc échoué')
      },
    },
  ]

  const { ok, errors } = await queue.runAll(tasks)
  if (!ok) {
    console.error('\n✗ Fix — erreurs :')
    for (const err of errors) console.error(`  • ${err.label}: ${err.message}`)
    process.exit(1)
  }
  console.log('\n✓ Tous les checks sont OK\n')
}

function checkPush() {
  if (runNode('check-push.mjs') !== 0) process.exit(1)
}

function help() {
  console.log(`
MOXT CLI — npm run moxt -- <commande>
Documentation complète : scripts/RACCOURCIS.md

Raccourcis npm :
  npm run tout -- -m "message"   TOUT : commit + push + deploy parallèle + CDN
  npm run ship -- -m "message"   idem tout
  npm run fix                    tests + checks en parallèle
  npm run check:push             vérif notifications push

Commandes :
  ship | go | cpd | tout   Commit (si -m), push, deploy parallèle
  deploy                   Deploy sans git
  fix                      Tests + site + SMSC en parallèle
  check-push               Web VAPID + Capacitor + FCM
  help                     Cette aide

Flags :
  -m "message"    Message de commit
  --no-commit    Push + deploy sans commit
  --purge-cdn     Purge CDN Yandex (défaut sur ship/tout/cpd/go)
  --skip-web      Sauter le site
  --skip-supabase Sauter Supabase
`)
}

async function main() {
  switch (command) {
    case 'ship':
    case 'go':
    case 'cpd':
      await ship()
      break
    case 'deploy':
      if (
        runNode('deploy-all.mjs', [
          '--parallel',
          ...argv.slice(1).filter((a) => !['deploy'].includes(a)),
        ]) !== 0
      ) {
        process.exit(1)
      }
      break
    case 'fix':
      await fix()
      break
    case 'check-push':
      checkPush()
      break
    case 'help':
    case '-h':
    case '--help':
      help()
      break
    default:
      console.error(`Commande inconnue : ${command}`)
      help()
      process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
