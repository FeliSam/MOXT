/**
 * Merge Phase 3 FR source maps (+ EN/RU/PT overlays) into packages/shared locales.
 *
 * Usage:
 *   node moxt-react/scripts/merge-phase3-locales.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const LOCALES_DIR = path.join(ROOT, 'packages/shared/src/i18n/locales')

function nestFlat(flat) {
  const root = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (node[part] == null || typeof node[part] !== 'object' || Array.isArray(node[part])) {
        node[part] = {}
      }
      node = node[part]
    }
    node[parts[parts.length - 1]] = value
  }
  return root
}

/** Set leaves from source into target without wiping unrelated siblings. */
function deepMergeLeaves(target, source) {
  if (source == null || typeof source !== 'object' || Array.isArray(source)) {
    return source
  }
  const out = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {}
  for (const [key, value] of Object.entries(source)) {
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMergeLeaves(out[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

function escapeString(value) {
  return JSON.stringify(String(value))
}

function isValidIdent(key) {
  return /^[A-Za-z_$][\w$]*$/.test(key)
}

function serialize(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const padInner = '  '.repeat(indent + 1)
  if (value == null) return 'null'
  if (typeof value === 'string') return escapeString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${padInner}${serialize(item, indent + 1)}`)
    return `[\n${items.join(',\n')},\n${pad}]`
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  const lines = entries.map(([key, child]) => {
    const renderedKey = isValidIdent(key) ? key : escapeString(key)
    return `${padInner}${renderedKey}: ${serialize(child, indent + 1)},`
  })
  return `{\n${lines.join('\n')}\n${pad}}`
}

function writeLocale(lang, localeObj, banner) {
  const body = `${banner}\nexport const ${lang} = ${serialize(localeObj)}\n`
  const filePath = path.join(LOCALES_DIR, `${lang}.js`)
  fs.writeFileSync(filePath, body, 'utf8')
  return filePath
}

function countLeaves(node) {
  if (node == null || typeof node !== 'object' || Array.isArray(node)) return 1
  return Object.values(node).reduce((sum, child) => sum + countLeaves(child), 0)
}

function leavesByNamespace(locale) {
  const counts = {}
  for (const [ns, tree] of Object.entries(locale)) {
    counts[ns] = countLeaves(tree)
  }
  return counts
}

async function loadFrSources() {
  const imports = [
    ['./moxt-react/src/i18n/phase3I18n.js', 'PHASE3_FR_SOURCES'],
    ['./moxt-react/src/features/communications/messagesI18n.js', 'MESSAGES_FR_SOURCES'],
    ['./moxt-react/src/features/businesses/businessesI18n.js', 'BUSINESSES_FR_SOURCES'],
    ['./moxt-react/src/features/businesses/professionalI18n.js', 'PROFESSIONAL_FR_SOURCES'],
    ['./moxt-react/src/features/admin/adminI18n.js', 'ADMIN_FR_SOURCES'],
    ['./moxt-react/src/i18n/sharedI18n.js', 'SHARED_FR_SOURCES'],
  ]
  const flat = {}
  for (const [rel, exportName] of imports) {
    const mod = await import(pathToFileURL(path.join(ROOT, rel)).href)
    Object.assign(flat, mod[exportName] || {})
  }
  return flat
}

async function main() {
  const frFlat = await loadFrSources()
  const overlayPath = path.join(ROOT, 'moxt-react/scripts/phase3-en-ru-pt.json')
  if (!fs.existsSync(overlayPath)) {
    throw new Error(`Missing translations overlay: ${overlayPath}`)
  }
  const overlays = JSON.parse(fs.readFileSync(overlayPath, 'utf8'))

  const missing = { en: [], ru: [], pt: [] }
  const enFlat = {}
  const ruFlat = {}
  const ptFlat = {}
  for (const key of Object.keys(frFlat)) {
    for (const lang of ['en', 'ru', 'pt']) {
      const value = overlays[lang]?.[key]
      if (!value) missing[lang].push(key)
      else if (lang === 'en') enFlat[key] = value
      else if (lang === 'ru') ruFlat[key] = value
      else ptFlat[key] = value
    }
  }
  const missingTotal = missing.en.length + missing.ru.length + missing.pt.length
  if (missingTotal > 0) {
    console.error('Missing translations:', {
      en: missing.en.length,
      ru: missing.ru.length,
      pt: missing.pt.length,
      sample: {
        en: missing.en.slice(0, 5),
        ru: missing.ru.slice(0, 5),
        pt: missing.pt.slice(0, 5),
      },
    })
    throw new Error(`Missing ${missingTotal} translation entries`)
  }

  const trees = {
    fr: nestFlat(frFlat),
    en: nestFlat(enFlat),
    ru: nestFlat(ruFlat),
    pt: nestFlat(ptFlat),
  }

  const banners = {
    fr: '/** French source of truth for MOXT UI copy. */',
    en: '/** English UI copy for MOXT. */',
    ru: '/** Russian UI copy for MOXT (RuStore). */',
    pt: '/** Portuguese UI copy for MOXT. */',
  }

  const counts = {}
  for (const lang of ['fr', 'en', 'ru', 'pt']) {
    const mod = await import(pathToFileURL(path.join(LOCALES_DIR, `${lang}.js`)).href + `?t=${Date.now()}`)
    const existing = mod[lang]
    const merged = deepMergeLeaves(existing, trees[lang])
    writeLocale(lang, merged, banners[lang])
    counts[lang] = leavesByNamespace(trees[lang])
  }

  console.log('Merged Phase 3 trees. Leaf counts per namespace (from Phase 3 sources):')
  console.log(JSON.stringify(counts.fr, null, 2))
  console.log('Total Phase 3 leaves:', Object.values(counts.fr).reduce((a, b) => a + b, 0))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
