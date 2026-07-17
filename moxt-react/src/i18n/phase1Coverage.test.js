import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { en } from '@moxt/shared/i18n/locales/en.js'
import { fr } from '@moxt/shared/i18n/locales/fr.js'
import { pt } from '@moxt/shared/i18n/locales/pt.js'
import { ru } from '@moxt/shared/i18n/locales/ru.js'

const PHASE_ONE_PAGES = [
  'LoginPage.jsx',
  'RegisterPage.jsx',
  'ForgotPasswordPage.jsx',
  'ResetPasswordPage.jsx',
  'AuthCallbackPage.jsx',
  'SettingsPage.jsx',
  'SecurityPage.jsx',
  'ProfilePage.jsx',
  'PersonalInformationPage.jsx',
  'DashboardPage.jsx',
]

const KEY_PATTERN =
  /(?:\bt\(\s*|(?:labelKey|descriptionKey|titleKey|tagKey)\s*:\s*)['"]([a-z][a-zA-Z0-9_.]+)['"]/g

function collectSourceFiles(target) {
  const stat = fs.statSync(target)
  if (stat.isFile()) return target.endsWith('.test.jsx') ? [] : [target]
  return fs
    .readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => collectSourceFiles(path.join(target, entry.name)))
    .filter((file) => /\.(?:js|jsx)$/.test(file))
}

function getValue(locale, key) {
  return key.split('.').reduce((node, segment) => node?.[segment], locale)
}

describe('Phase 1 web translation coverage', () => {
  it('résout toutes les clés utilisées par les parcours critiques', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
    const files = [
      ...PHASE_ONE_PAGES.map((file) => path.join(root, 'src', 'pages', file)),
      ...collectSourceFiles(path.join(root, 'src', 'features', 'profile')),
      ...collectSourceFiles(path.join(root, 'src', 'features', 'dashboard')),
      ...collectSourceFiles(path.join(root, 'src', 'features', 'security')),
    ]

    const keys = new Set()
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const match of source.matchAll(KEY_PATTERN)) keys.add(match[1])
    }

    expect(keys.size).toBeGreaterThan(100)
    for (const key of keys) {
      for (const [language, locale] of Object.entries({ fr, en, ru, pt })) {
        expect(getValue(locale, key), `${language}: ${key}`).toBeTruthy()
      }
    }
  })
})
