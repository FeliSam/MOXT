import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const lockPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sms-infra.lock.json')

export function readSmsInfraLock() {
  if (!existsSync(lockPath)) return null
  try {
    return JSON.parse(readFileSync(lockPath, 'utf8'))
  } catch {
    return null
  }
}

export function isSmsInfraLocked() {
  return Boolean(readSmsInfraLock()?.locked)
}

export function assertSmsInfraChangeAllowed(scriptName, { force = process.argv.includes('--force') } = {}) {
  const lock = readSmsInfraLock()
  if (!lock?.locked || force) return lock
  console.error(`\n✗ Infrastructure SMS verrouillée (${scriptName}).`)
  if (lock.reason) console.error(`  ${lock.reason}`)
  console.error('  Pour resynchroniser la config validée : npm run setup:smsc')
  console.error('  Pour forcer une modification : ajoutez --force\n')
  process.exit(1)
}

export function warnSmsInfraLocked(scriptName) {
  const lock = readSmsInfraLock()
  if (!lock?.locked) return
  console.log(`\n  🔒 SMS verrouillé — ${scriptName} resynchronise uniquement la config ${lock.provider || 'smsc'}.`)
}
