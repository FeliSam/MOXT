#!/usr/bin/env node
/**
 * Apply flat key→Spanish maps onto packages/shared/src/i18n/locales/es.js
 * Usage: node scripts/apply-es-translations.mjs [map1.json map2.json ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { es as currentEs } from '../packages/shared/src/i18n/locales/es.js'
import { en } from '../packages/shared/src/i18n/locales/en.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ES_FILE = path.join(ROOT, 'packages/shared/src/i18n/locales/es.js')

function flatten(node, prefix = '', out = {}) {
  if (node == null || typeof node !== 'object' || Array.isArray(node)) {
    if (prefix) out[prefix] = node
    return out
  }
  for (const [k, v] of Object.entries(node)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v != null && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out)
    else out[p] = v
  }
  return out
}

function setPath(root, dotted, value) {
  const parts = dotted.split('.')
  let node = root
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (node[key] == null || typeof node[key] !== 'object' || Array.isArray(node[key])) {
      node[key] = {}
    }
    node = node[key]
  }
  node[parts[parts.length - 1]] = value
}

function escapeString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function serialize(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const padInner = '  '.repeat(indent + 1)
  if (typeof value === 'string') return `"${escapeString(value)}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value == null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.every((v) => typeof v === 'string')) {
      const lines = value.map((v) => `${padInner}"${escapeString(v)}",`)
      return `[\n${lines.join('\n')}\n${pad}]`
    }
    const lines = value.map((v) => `${padInner}${serialize(v, indent + 1)},`)
    return `[\n${lines.join('\n')}\n${pad}]`
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  const lines = entries.map(([k, v]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
    return `${padInner}${key}: ${serialize(v, indent + 1)},`
  })
  return `{\n${lines.join('\n')}\n${pad}}`
}

function loadMaps(files) {
  const map = {}
  for (const file of files) {
    const abs = path.resolve(ROOT, file)
    const data = JSON.parse(fs.readFileSync(abs, 'utf8'))
    const entries = data.translations || data.map || data
    if (Array.isArray(entries)) {
      for (const row of entries) {
        if (row.k && row.es != null) map[row.k] = row.es
        else if (row.key && row.es != null) map[row.key] = row.es
      }
    } else {
      Object.assign(map, entries)
    }
  }
  return map
}

const mapFiles = process.argv.slice(2)
if (!mapFiles.length) {
  const dir = path.join(ROOT, 'scripts/.es-out')
  if (fs.existsSync(dir)) {
    mapFiles.push(
      ...fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.join('scripts/.es-out', f)),
    )
  }
}

if (!mapFiles.length) {
  console.error('No translation map files found.')
  process.exit(1)
}

const translations = loadMaps(mapFiles)
const next = structuredClone(currentEs)
let applied = 0
let skipped = 0
const enFlat = flatten(en)

for (const [key, value] of Object.entries(translations)) {
  if (typeof value !== 'string') {
    skipped += 1
    continue
  }
  if (!(key in enFlat)) {
    console.warn('Unknown key skipped:', key)
    skipped += 1
    continue
  }
  // Preserve placeholders
  const enVal = String(enFlat[key] ?? '')
  const enTokens = enVal.match(/\{[^}]+\}/g) || []
  const esTokens = value.match(/\{[^}]+\}/g) || []
  if (enTokens.join() !== esTokens.join()) {
    console.warn('Placeholder mismatch, still applying:', key)
  }
  setPath(next, key, value)
  applied += 1
}

const header = '/** Spanish UI copy for MOXT. */\nexport const es = '
const body = serialize(next, 0)
fs.writeFileSync(ES_FILE, `${header}${body}\n`, 'utf8')

const nextFlat = flatten(next)
const same = Object.keys(enFlat).filter((k) => nextFlat[k] === enFlat[k]).length
const different = Object.keys(enFlat).length - same
console.log(
  JSON.stringify(
    {
      applied,
      skipped,
      maps: mapFiles.length,
      sameAsEn: same,
      different,
      pct: ((100 * different) / Object.keys(enFlat).length).toFixed(1),
    },
    null,
    2,
  ),
)
