import { afterEach, describe, expect, it, vi } from 'vitest'
import { CANONICAL_SITE_URL, buildAbsoluteUrl, getSiteUrl } from './siteUrl'

describe('siteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prefers VITE_SITE_URL when set', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.test/')
    expect(getSiteUrl()).toBe('https://example.test')
  })

  it('falls back to canonical URL without window', () => {
    vi.stubGlobal('window', undefined)
    expect(getSiteUrl()).toBe(CANONICAL_SITE_URL)
  })

  it('builds absolute paths from site URL', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(buildAbsoluteUrl('/news')).toBe('https://moxtapp.ru/news')
    expect(buildAbsoluteUrl('legal/privacy')).toBe('https://moxtapp.ru/legal/privacy')
  })
})
