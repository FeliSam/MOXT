/**
 * Finalize Phase 3 locale merge from FR sources + overlay translations.
 * Usage: node moxt-react/scripts/finalize-phase3-merge.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const LOCALES_DIR = path.join(ROOT, 'packages/shared/src/i18n/locales')
const OVERLAY_DIR = path.join(ROOT, 'moxt-react/scripts/phase3-overlays')

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

function deepMergeLeaves(target, source) {
  if (source == null || typeof source !== 'object' || Array.isArray(source)) return source
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
  fs.writeFileSync(path.join(LOCALES_DIR, `${lang}.js`), body, 'utf8')
}

function countLeaves(node) {
  if (node == null || typeof node !== 'object' || Array.isArray(node)) return 1
  return Object.values(node).reduce((sum, child) => sum + countLeaves(child), 0)
}

function leavesByNamespace(locale) {
  const counts = {}
  for (const [ns, tree] of Object.entries(locale)) counts[ns] = countLeaves(tree)
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

function loadOverlays() {
  const en = {}
  const ru = {}
  const pt = {}
  for (const name of ['g1', 'g2', 'g3', 'g4', 'g5']) {
    const file = path.join(OVERLAY_DIR, `${name}.json`)
    if (!fs.existsSync(file)) continue
    const ov = JSON.parse(fs.readFileSync(file, 'utf8'))
    Object.assign(en, ov.en)
    Object.assign(ru, ov.ru)
    Object.assign(pt, ov.pt)
  }
  // Extra remaining overrides: key → [en,ru,pt]
  const remPath = path.join(OVERLAY_DIR, 'remaining-overrides.json')
  if (fs.existsSync(remPath)) {
    const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'))
    for (const [key, triple] of Object.entries(rem)) {
      en[key] = triple[0]
      ru[key] = triple[1]
      pt[key] = triple[2]
    }
  }
  return { en, ru, pt }
}

async function main() {
  const frFlat = await loadFrSources()
  const overlays = loadOverlays()
  const missing = { en: [], ru: [], pt: [] }
  // Until remaining-overrides is complete, fill gaps with FR so all 4 locales
  // share the same key tree (locales.test.js). Replace with natural EN/RU/PT next.
  for (const key of Object.keys(frFlat)) {
    for (const lang of ['en', 'ru', 'pt']) {
      if (!overlays[lang][key]) {
        missing[lang].push(key)
        overlays[lang][key] = frFlat[key]
      }
    }
  }
  fs.writeFileSync(
    path.join(OVERLAY_DIR, 'merge-missing.json'),
    JSON.stringify(
      { en: missing.en.length, ru: missing.ru.length, pt: missing.pt.length, sample: missing.en.slice(0, 30) },
      null,
      2,
    ),
  )
  console.warn('FR-fallback keys pending natural translation:', missing.en.length)

  const trees = {
    fr: nestFlat(frFlat),
    en: nestFlat(overlays.en),
    ru: nestFlat(overlays.ru),
    pt: nestFlat(overlays.pt),
  }

  const banners = {
    fr: '/** French source of truth for MOXT UI copy. */',
    en: '/** English UI copy for MOXT. */',
    ru: '/** Russian UI copy for MOXT (RuStore). */',
    pt: '/** Portuguese UI copy for MOXT. */',
  }

  for (const lang of ['fr', 'en', 'ru', 'pt']) {
    const mod = await import(
      pathToFileURL(path.join(LOCALES_DIR, `${lang}.js`)).href + `?t=${Date.now()}`
    )
    const merged = deepMergeLeaves(mod[lang], trees[lang])
    writeLocale(lang, merged, banners[lang])
  }

  const counts = leavesByNamespace(trees.fr)
  console.log(JSON.stringify({ leafCounts: counts, total: Object.keys(frFlat).length }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
