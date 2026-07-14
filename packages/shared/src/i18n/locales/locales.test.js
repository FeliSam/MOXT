import { describe, expect, it } from 'vitest'
import { en } from './en.js'
import { fr } from './fr.js'
import { pt } from './pt.js'
import { ru } from './ru.js'

function flattenKeys(node, prefix = '') {
  if (node == null || typeof node !== 'object' || Array.isArray(node)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value, path)
    }
    return [path]
  })
}

describe('locales t()', () => {
  const frKeys = flattenKeys(fr).sort()

  it('expose les memes cles en en, ru et pt que en fr', () => {
    expect(flattenKeys(en).sort()).toEqual(frKeys)
    expect(flattenKeys(ru).sort()).toEqual(frKeys)
    expect(flattenKeys(pt).sort()).toEqual(frKeys)
  })

  it('couvre les cles phase 2 partage et messagerie', () => {
    for (const locale of [fr, en, ru, pt]) {
      expect(locale.share.tabTypeLabel).toBeTruthy()
      expect(locale.share.steps.step1Title).toBeTruthy()
      expect(locale.messages.syncing).toBeTruthy()
      expect(locale.messages.maxImages).toBeTruthy()
      expect(locale.settings.push.errors.missingVapid).toBeTruthy()
      expect(locale.common.pullToRefresh.pull).toBeTruthy()
      expect(locale.security.email.otpLabel).toBeTruthy()
      expect(locale.auth.register.codeResentTitle).toBeTruthy()
      expect(locale.legal.sections.privacy.paragraphs.length).toBeGreaterThan(12)
      expect(locale.verification.consent.privacyLink).toBeTruthy()
      expect(locale.verification.consent.termsLink).toBeTruthy()
      expect(locale.verification.admin.navLabel).toBeTruthy()
      expect(locale.verification.admin.documentsTitle).toBeTruthy()
      expect(locale.verification.admin.notifyTitle).toBeTruthy()
    }
  })
})
