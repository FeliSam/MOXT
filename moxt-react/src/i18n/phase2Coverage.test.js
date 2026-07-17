import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { en } from '@moxt/shared/i18n/locales/en.js'
import { fr } from '@moxt/shared/i18n/locales/fr.js'
import { pt } from '@moxt/shared/i18n/locales/pt.js'
import { ru } from '@moxt/shared/i18n/locales/ru.js'

const PHASE_TWO_PAGES = [
  'MarketplacePage.jsx',
  'ListingDetailPage.jsx',
  'EditListingPage.jsx',
  'PublishListingPage.jsx',
  'MyListingsPage.jsx',
  'TransfersPage.jsx',
  'NewTransferPage.jsx',
  'TransferDetailPage.jsx',
  'P2PPage.jsx',
  'P2PDetailPage.jsx',
  'P2POrderPage.jsx',
  'PublishP2PPage.jsx',
  'ParcelsPage.jsx',
  'ParcelDetailPage.jsx',
  'EditParcelPage.jsx',
  'PublishParcelPage.jsx',
  'JobsPage.jsx',
  'JobDetailPage.jsx',
  'JobApplicationsPage.jsx',
  'EditJobPage.jsx',
  'PublishJobPage.jsx',
  'EventsPage.jsx',
  'EventDetailPage.jsx',
  'EditEventPage.jsx',
  'PublishEventPage.jsx',
]

const FEATURE_DIRECTORIES = [
  'marketplace',
  'publications',
  'transfers',
  'p2p',
  'parcels',
  'jobs',
  'events',
]

const KEY_PATTERN =
  /(?:\b(?:t|publishText|marketplaceText)\(\s*(?:[a-zA-Z_$][\w$]*,\s*)?|(?:labelKey|descriptionKey|titleKey|tagKey|hintKey|placeholderKey|subKey|optionKey)\s*:\s*)['"]([a-z][a-zA-Z0-9_.]+)['"]/g

function collectSourceFiles(target) {
  if (!fs.existsSync(target)) return []
  const stat = fs.statSync(target)
  if (stat.isFile()) return /\.test\.[jt]sx?$/.test(target) ? [] : [target]
  return fs
    .readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => collectSourceFiles(path.join(target, entry.name)))
    .filter((file) => /\.[jt]sx?$/.test(file))
}

function getValue(locale, key) {
  return key.split('.').reduce((node, segment) => node?.[segment], locale)
}

describe('Phase 2 web translation coverage', () => {
  it('résout les clés des parcours métier dans les quatre langues', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
    const files = [
      ...PHASE_TWO_PAGES.map((file) => path.join(root, 'src', 'pages', file)).filter(
        fs.existsSync,
      ),
      ...FEATURE_DIRECTORIES.flatMap((directory) =>
        collectSourceFiles(path.join(root, 'src', 'features', directory)),
      ),
      path.join(root, 'src', 'components', 'ui', 'CatalogSearch.jsx'),
      path.join(root, 'src', 'components', 'ui', 'ReportDialog.jsx'),
    ]

    const keys = new Set()
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const match of source.matchAll(KEY_PATTERN)) keys.add(match[1])
    }

    expect(keys.size).toBeGreaterThan(150)
    for (const key of keys) {
      for (const [language, locale] of Object.entries({ fr, en, ru, pt })) {
        expect(getValue(locale, key), `${language}: ${key}`).toBeTruthy()
      }
    }
  })
})
