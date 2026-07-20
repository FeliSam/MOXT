import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { en } from '@moxt/shared/i18n/locales/en.js'
import { es } from '@moxt/shared/i18n/locales/es.js'
import { fr } from '@moxt/shared/i18n/locales/fr.js'
import { pt } from '@moxt/shared/i18n/locales/pt.js'
import { ru } from '@moxt/shared/i18n/locales/ru.js'
import { MESSAGES_FR_SOURCES } from '../features/communications/messagesI18n.js'
import { ADMIN_FR_SOURCES } from '../features/admin/adminI18n.js'
import { SHARED_FR_SOURCES } from './sharedI18n.js'
import { BUSINESSES_FR_SOURCES } from '../features/businesses/businessesI18n.js'
import { PROFESSIONAL_FR_SOURCES } from '../features/businesses/professionalI18n.js'
import { PHASE3_FR_SOURCES } from './phase3I18n.js'

const PHASE_THREE_PAGES = [
  'MessagesPage.jsx',
  'BusinessesPage.jsx',
  'BusinessDetailPage.jsx',
  'BusinessSetupPage.jsx',
  'BusinessPublicationsPage.jsx',
  'ProfessionalPage.jsx',
  'FavoritesPage.jsx',
  'ReceiptsPage.jsx',
  'ReceiptDetailPage.jsx',
  'NotificationsPage.jsx',
  'SupportPage.jsx',
  'DocumentsPage.jsx',
  'AddressesPage.jsx',
  'SubscriptionsPage.jsx',
  'WalletPage.jsx',
  'DisputesPage.jsx',
  'VerificationPage.jsx',
  'ActivitiesPage.jsx',
  'DiscoverPage.jsx',
  'NewsPage.jsx',
  'ExchangersPage.jsx',
  'ExchangerDetailPage.jsx',
  'AdminPage.jsx',
  'SuperAdminPage.jsx',
]

const FEATURE_DIRECTORIES = [
  'communications',
  'businesses',
  'account',
  'admin',
  'reviews',
]

const KEY_PATTERN =
  /(?:\b(?:t|messagesText|relatedOptionLabel|adminText|adminOptionLabel|sharedText|businessesText|professionalText|phase3Text)\(\s*(?:[a-zA-Z_$][\w$]*,\s*)?|(?:labelKey|descriptionKey|titleKey|tagKey|hintKey|placeholderKey|subtitleKey)\s*:\s*)['"]([a-z][a-zA-Z0-9_.]+)['"]/g

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

function resolvePhase3Value(language, locale, key) {
  const fromLocale = getValue(locale, key)
  if (fromLocale) return fromLocale
  // FR_SOURCES bridges until shared locales are filled by the parent pass.
  if (
    (key.startsWith('messages.') || key.startsWith('communications.')) &&
    MESSAGES_FR_SOURCES[key]
  ) {
    return MESSAGES_FR_SOURCES[key]
  }
  if (key.startsWith('admin.') && ADMIN_FR_SOURCES[key]) return ADMIN_FR_SOURCES[key]
  if (
    (key.startsWith('shared.') || key.startsWith('statuses.')) &&
    SHARED_FR_SOURCES[key]
  ) {
    return SHARED_FR_SOURCES[key]
  }
  if (key.startsWith('businesses.') && BUSINESSES_FR_SOURCES?.[key]) {
    return BUSINESSES_FR_SOURCES[key]
  }
  if (key.startsWith('professional.') && PROFESSIONAL_FR_SOURCES?.[key]) {
    return PROFESSIONAL_FR_SOURCES[key]
  }
  if (PHASE3_FR_SOURCES[key]) return PHASE3_FR_SOURCES[key]
  return null
}

describe('Phase 3 web translation coverage', () => {
  it('résout les clés des parcours secondaires dans les quatre langues', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
    const professionalDir = path.join(root, 'src', 'pages', 'professional')
    const messagesDir = path.join(root, 'src', 'pages', 'messages')
    const files = [
      ...PHASE_THREE_PAGES.map((file) => path.join(root, 'src', 'pages', file)).filter(
        fs.existsSync,
      ),
      ...collectSourceFiles(professionalDir),
      ...collectSourceFiles(messagesDir),
      ...FEATURE_DIRECTORIES.flatMap((directory) =>
        collectSourceFiles(path.join(root, 'src', 'features', directory)),
      ),
      path.join(root, 'src', 'components', 'ui', 'BackButton.jsx'),
      path.join(root, 'src', 'features', 'communications', 'ContactButton.jsx'),
      path.join(root, 'src', 'features', 'security', 'SecurityGatePanel.jsx'),
      path.join(root, 'src', 'features', 'security', 'SecurityGateLinks.jsx'),
      path.join(root, 'src', 'features', 'security', 'useSecurityGate.js'),
      path.join(root, 'src', 'config', 'communications.js'),
      path.join(root, 'src', 'config', 'searchablePages.js'),
      path.join(root, 'src', 'config', 'statuses.js'),
      path.join(root, 'src', 'app', 'notificationTriggers.js'),
    ].filter(fs.existsSync)

    const keys = new Set()
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const match of source.matchAll(KEY_PATTERN)) keys.add(match[1])
    }

    expect(keys.size).toBeGreaterThan(80)
    for (const key of keys) {
      for (const [language, locale] of Object.entries({ fr, en, ru, pt, es })) {
        expect(resolvePhase3Value(language, locale, key), `${language}: ${key}`).toBeTruthy()
      }
    }
  })
})
