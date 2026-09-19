import { describe, expect, it, vi } from 'vitest'
import { buildEntitySharePreviewUrl, buildEntityShareUrl } from './shareLinkUtils.js'

describe('shareLinkUtils (web)', () => {
  it('builds preview url on www.moxtapp.ru/share for crawlers', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntitySharePreviewUrl({ kind: 'listing', entityId: 'ANN-1' }),
    ).toBe('https://www.moxtapp.ru/share/listing/ANN-1')
    vi.unstubAllEnvs()
  })

  it('prefers /share URLs when kind and entityId are known', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntityShareUrl({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing:ANN-1',
      }),
    ).toBe('https://www.moxtapp.ru/share/listing/ANN-1')
    expect(
      buildEntityShareUrl({
        kind: 'parcel',
        entityId: 'PAR-1',
        href: '/parcels/PAR-1',
        feedHref: '/feed?item=parcel%3APAR-1',
      }),
    ).toBe('https://www.moxtapp.ru/share/parcel/PAR-1')
    expect(
      buildEntityShareUrl({
        kind: 'video',
        entityId: 'VID-1',
        href: '/feed?type=video&item=video%3AVID-1',
        feedHref: '/feed?item=video%3AVID-1',
      }),
    ).toBe('https://www.moxtapp.ru/share/video/VID-1')
    vi.unstubAllEnvs()
  })

  it('falls back to site deep links when kind/entityId missing', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntityShareUrl({
        href: '/feed?type=video&item=video%3AVID-1',
      }),
    ).toBe('https://www.moxtapp.ru/feed?type=video&item=video%3AVID-1')
    vi.unstubAllEnvs()
  })
})
