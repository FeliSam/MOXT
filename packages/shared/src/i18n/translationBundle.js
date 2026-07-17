import { ENGLISH_UI_CATALOG } from './englishUiCatalog.js'
import { PLACEHOLDER_CATALOGS } from './placeholderCatalog.js'
import { PUBLISH_AUTH_CATALOGS } from './publishAuthCatalog.js'
import { PUBLIC_LANDING_CATALOGS } from './publicLandingCatalog.js'
import { SHARE_REFERRAL_CATALOGS } from './shareReferralCatalog.js'
import { fr } from './locales/fr.js'
import { en } from './locales/en.js'
import { ru } from './locales/ru.js'
import { pt } from './locales/pt.js'

export const SOURCE_LANGUAGE = 'fr'
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ru', 'pt']

const TARGET_LANGUAGES = SUPPORTED_LANGUAGES.filter((lang) => lang !== SOURCE_LANGUAGE)

const UI_CATALOGS = [
  {
    id: 'englishUi',
    file: 'packages/shared/src/i18n/englishUiCatalog.js',
    sectionForLang: { en: null },
    sectionStyle: 'const',
    maps: { en: ENGLISH_UI_CATALOG },
  },
  {
    id: 'placeholder',
    file: 'packages/shared/src/i18n/placeholderCatalog.js',
    sectionForLang: { en: 'EN', ru: 'RU', pt: 'PT' },
    sectionStyle: 'const',
    maps: PLACEHOLDER_CATALOGS,
  },
  {
    id: 'publishAuth',
    file: 'packages/shared/src/i18n/publishAuthCatalog.js',
    sectionForLang: { en: 'EN', ru: 'RU', pt: 'PT' },
    sectionStyle: 'const',
    maps: PUBLISH_AUTH_CATALOGS,
  },
  {
    id: 'shareReferral',
    file: 'packages/shared/src/i18n/shareReferralCatalog.js',
    sectionForLang: { en: 'en', ru: 'ru', pt: 'pt' },
    sectionStyle: 'lang',
    maps: SHARE_REFERRAL_CATALOGS,
  },
  {
    id: 'publicLanding',
    file: 'packages/shared/src/i18n/publicLandingCatalog.js',
    sectionForLang: { en: 'en', ru: 'ru', pt: 'pt' },
    sectionStyle: 'lang',
    maps: PUBLIC_LANDING_CATALOGS,
  },
]

const KEY_LOCALES = { fr, en, ru, pt }

const LOCALE_FILES = {
  en: 'packages/shared/src/i18n/locales/en.js',
  ru: 'packages/shared/src/i18n/locales/ru.js',
  pt: 'packages/shared/src/i18n/locales/pt.js',
}

function flattenStrings(node, prefix = '') {
  const out = {}
  if (typeof node === 'string') {
    if (prefix) out[prefix] = node
    return out
  }
  if (!node || typeof node !== 'object') return out
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    Object.assign(out, flattenStrings(value, path))
  }
  return out
}

function unflattenStrings(flat) {
  const root = {}
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.')
    let node = root
    for (let i = 0; i < parts.length - 1; i += 1) {
      node[parts[i]] = node[parts[i]] || {}
      node = node[parts[i]]
    }
    node[parts[parts.length - 1]] = value
  }
  return root
}

function collectFrenchUiPhrases() {
  const phraseMap = new Map()

  function addPhrase(frText, catalogId, translations = {}) {
    if (!frText || typeof frText !== 'string') return
    const existing = phraseMap.get(frText) || {
      fr: frText,
      catalog: catalogId,
      translations: {},
    }
    for (const [lang, value] of Object.entries(translations)) {
      if (value) existing.translations[lang] = value
    }
    phraseMap.set(frText, existing)
  }

  for (const { id, maps } of UI_CATALOGS) {
    for (const [lang, catalog] of Object.entries(maps)) {
      for (const [frText, translation] of Object.entries(catalog || {})) {
        addPhrase(frText, id, { [lang]: translation })
      }
    }
  }

  return [...phraseMap.values()]
    .map((entry) => ({
      fr: entry.fr,
      catalog: entry.catalog,
      en: entry.translations.en || entry.fr,
      ru: entry.translations.ru || entry.fr,
      pt: entry.translations.pt || entry.fr,
    }))
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'))
}

function collectStructuredKeys() {
  const flatByLang = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang, flattenStrings(KEY_LOCALES[lang])]),
  )
  const keys = new Set(SUPPORTED_LANGUAGES.flatMap((lang) => Object.keys(flatByLang[lang])))
  return [...keys]
    .sort()
    .map((key) => {
      const row = { key }
      for (const lang of SUPPORTED_LANGUAGES) {
        row[lang] = flatByLang[lang][key] ?? ''
      }
      return row
    })
}

export function buildTranslationBundle() {
  return {
    meta: {
      exportedAt: new Date().toISOString(),
      sourceLanguage: SOURCE_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
      format: 'moxt-i18n-v1',
    },
    uiPhrases: collectFrenchUiPhrases(),
    keys: collectStructuredKeys(),
  }
}

export function validateTranslationBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Fichier JSON invalide : objet racine attendu.')
  }
  if (!Array.isArray(bundle.uiPhrases) || !Array.isArray(bundle.keys)) {
    throw new Error('Format invalide : uiPhrases et keys doivent être des tableaux.')
  }
  return bundle
}

export function diffTranslationBundle(current, incoming) {
  const uiChanges = []
  const incomingUi = new Map(incoming.uiPhrases.map((row) => [row.fr, row]))
  for (const row of current.uiPhrases) {
    const next = incomingUi.get(row.fr)
    if (!next) continue
    for (const lang of TARGET_LANGUAGES) {
      if (next[lang] && next[lang] !== row[lang]) {
        uiChanges.push({ fr: row.fr, lang, from: row[lang], to: next[lang], catalog: row.catalog })
      }
    }
  }

  const keyChanges = []
  const incomingKeys = new Map(incoming.keys.map((row) => [row.key, row]))
  for (const row of current.keys) {
    const next = incomingKeys.get(row.key)
    if (!next) continue
    for (const lang of SUPPORTED_LANGUAGES) {
      if (next[lang] && next[lang] !== row[lang]) {
        keyChanges.push({ key: row.key, lang, from: row[lang], to: next[lang] })
      }
    }
  }

  return { uiChanges, keyChanges }
}

function escapeJsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function replacePhraseEntry(sectionContent, frText, nextValue) {
  const frEscaped = escapeJsString(frText)
  const nextEscaped = escapeJsString(nextValue)
  const pattern = new RegExp(
    `(['"])${frEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1\\s*:\\s*(['"])(?:\\\\.|(?!\\2).)*\\2`,
    'u',
  )
  if (!pattern.test(sectionContent)) return sectionContent
  return sectionContent.replace(pattern, `'${frEscaped}': '${nextEscaped}'`)
}

function replaceInFileSection(fileContent, sectionName, frText, nextValue, sectionStyle = 'const') {
  if (!sectionName) return replacePhraseEntry(fileContent, frText, nextValue)
  const marker =
    sectionStyle === 'lang' ? `  ${sectionName}: {` : `const ${sectionName} = {`
  const start = fileContent.indexOf(marker)
  if (start === -1) return fileContent
  const nextSection =
    sectionStyle === 'lang'
      ? fileContent.indexOf('\n  ', start + marker.length)
      : fileContent.indexOf('\nconst ', start + marker.length)
  const end = nextSection === -1 ? fileContent.length : nextSection
  const section = fileContent.slice(start, end)
  const updated = replacePhraseEntry(section, frText, nextValue)
  return fileContent.slice(0, start) + updated + fileContent.slice(end)
}

function serializeLocaleModule(lang, tree) {
  const body = JSON.stringify(tree, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")
  return `export const ${lang} = ${body}\n`
}

function catalogMeta(catalogId) {
  return UI_CATALOGS.find((entry) => entry.id === catalogId)
}

export function applyTranslationBundle(bundle, { rootDir, readFile, writeFile }) {
  const current = buildTranslationBundle()
  const { uiChanges, keyChanges } = diffTranslationBundle(current, bundle)
  const files = new Map()

  function load(relPath) {
    if (!files.has(relPath)) {
      files.set(relPath, readFile(`${rootDir}/${relPath}`))
    }
    return files.get(relPath)
  }

  function save(relPath, content) {
    files.set(relPath, content)
  }

  for (const change of uiChanges) {
    const meta = catalogMeta(change.catalog)
    if (!meta) continue
    const sectionName = meta.sectionForLang[change.lang]
    const updated = replaceInFileSection(
      load(meta.file),
      sectionName,
      change.fr,
      change.to,
      meta.sectionStyle || 'const',
    )
    save(meta.file, updated)
  }

  if (keyChanges.length) {
    const flatByLang = Object.fromEntries(
      SUPPORTED_LANGUAGES.map((lang) => [lang, flattenStrings(KEY_LOCALES[lang])]),
    )
    for (const change of keyChanges) {
      flatByLang[change.lang][change.key] = change.to
    }
    for (const lang of ['en', 'ru', 'pt']) {
      save(LOCALE_FILES[lang], serializeLocaleModule(lang, unflattenStrings(flatByLang[lang])))
    }
  }

  for (const [relPath, content] of files.entries()) {
    writeFile(`${rootDir}/${relPath}`, content)
  }

  return { uiChanges, keyChanges, filesUpdated: [...files.keys()] }
}
