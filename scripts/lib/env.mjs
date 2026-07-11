import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const phase2EnvPath = path.join(root, 'scripts', 'phase2.env')

export { root, phase2EnvPath }

export function parseEnvFile(filePath) {
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

export function loadPhase2Env() {
  const fromFile = parseEnvFile(phase2EnvPath)
  const merged = { ...fromFile }
  for (const [key, value] of Object.entries(process.env)) {
    if (value) merged[key] = value
  }
  return merged
}

export function upsertPhase2Env(updates) {
  const current = parseEnvFile(phase2EnvPath)
  const next = { ...current, ...updates }
  const lines = existsSync(phase2EnvPath)
    ? readFileSync(phase2EnvPath, 'utf8').split(/\r?\n/)
    : ['# MOXT phase2.env — ne pas commiter']

  const keys = new Set(Object.keys(updates))
  const kept = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return true
    const eq = trimmed.indexOf('=')
    if (eq < 0) return true
    return !keys.has(trimmed.slice(0, eq).trim())
  })

  for (const [key, value] of Object.entries(updates)) {
    kept.push(`${key}=${value}`)
  }

  writeFileSync(phase2EnvPath, `${kept.join('\n').replace(/\n+$/, '')}\n`, 'utf8')
}
