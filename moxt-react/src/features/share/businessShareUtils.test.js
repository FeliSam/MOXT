import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CANONICAL_SHARE_SITE } from '@moxt/shared/share/shareLinkUtils.js'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  buildBusinessShareUrlFromValues,
} from './businessShareUtils.js'

describe('businessShareUtils', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
  })

  it('prefers OG gateway share URL for absolute business shares', () => {
    const url = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(url).toBe(`${CANONICAL_SHARE_SITE}/share/business/BIZ-1`)
  })

  it('keeps relative business paths without the OG host', () => {
    const relative = buildBusinessShareUrl(
      {
        id: 'BIZ-1',
        name: 'Alpha',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      { absolute: false },
    )
    expect(relative).toContain('/businesses/BIZ-1')
    expect(relative).toContain('v=')
    expect(relative.startsWith('http')).toBe(false)
  })

  it('builds share url from form values via OG gateway', () => {
    const url = buildBusinessShareUrlFromValues({
      id: 'BIZ-2',
      name: 'Beta',
    })
    expect(url).toBe(`${CANONICAL_SHARE_SITE}/share/business/BIZ-2`)
  })

  it('builds share text with contacts', () => {
    const text = buildBusinessShareText({
      name: 'Alpha',
      city: 'Cotonou',
      phone: '+229000',
      description: 'Hello',
    })
    expect(text).toContain('Alpha')
    expect(text).toContain('Cotonou')
  })
})
