import { describe, expect, it, vi } from 'vitest'
import { buildEntitySharePreviewUrl, buildEntityShareUrl } from './shareLinkUtils.js'

describe('shareLinkUtils (web)', () => {
  it('builds preview url on supabase for crawlers', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    expect(
      buildEntitySharePreviewUrl({ kind: 'listing', entityId: 'ANN-1' }),
    ).toBe('https://abc.supabase.co/functions/v1/share-preview/listing/ANN-1')
    vi.unstubAllEnvs()
  })

  it('shares public marketplace links and feed deep links for other modules', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntityShareUrl({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing:ANN-1',
      }),
    ).toBe('https://moxtapp.ru/marketplace/ANN-1')
    expect(
      buildEntityShareUrl({
        kind: 'parcel',
        entityId: 'PAR-1',
        href: '/parcels/PAR-1',
        feedHref: '/feed?item=parcel%3APAR-1',
      }),
    ).toBe('https://moxtapp.ru/feed?item=parcel%3APAR-1')
    expect(
      buildEntityShareUrl({
        kind: 'video',
        entityId: 'VID-1',
        href: '/feed?type=video&item=video%3AVID-1',
        feedHref: '/feed?item=video%3AVID-1',
      }),
    ).toBe('https://moxtapp.ru/feed?type=video&item=video%3AVID-1')
    vi.unstubAllEnvs()
  })
})
