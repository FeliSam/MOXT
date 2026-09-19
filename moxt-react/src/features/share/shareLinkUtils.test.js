import { describe, expect, it, vi } from 'vitest'
import { CANONICAL_SHARE_SITE } from '@moxt/shared/share/shareLinkUtils.js'
import { buildEntitySharePreviewUrl, buildEntityShareUrl } from './shareLinkUtils.js'

describe('shareLinkUtils (web)', () => {
  it('builds preview url on the OG gateway for crawlers', () => {
    expect(
      buildEntitySharePreviewUrl({ kind: 'listing', entityId: 'ANN-1' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/listing/ANN-1`)
  })

  it('emits gateway OG URL for listing ANN-MSS17OT2 (clipboard / share icons)', () => {
    expect(
      buildEntityShareUrl({
        kind: 'listing',
        entityId: 'ANN-MSS17OT2',
        href: '/marketplace/ANN-MSS17OT2',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/listing/ANN-MSS17OT2`)
  })

  it('normalizes plural / profile relatedType aliases to singular OG kinds', () => {
    expect(
      buildEntityShareUrl({ kind: 'listings', entityId: 'ANN-2' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/listing/ANN-2`)
    expect(
      buildEntityShareUrl({ kind: 'videos', entityId: 'VID-2' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/video/VID-2`)
    expect(
      buildEntityShareUrl({ kind: 'posts', entityId: 'POST-2' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/post/POST-2`)
    expect(
      buildEntityShareUrl({ kind: 'profile', entityId: 'USR-1' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/user/USR-1`)
  })

  it('prefers gateway /share URLs when kind and entityId are known', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntityShareUrl({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing:ANN-1',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/listing/ANN-1`)
    expect(
      buildEntityShareUrl({
        kind: 'parcel',
        entityId: 'PAR-1',
        href: '/parcels/PAR-1',
        feedHref: '/feed?item=parcel%3APAR-1',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/parcel/PAR-1`)
    expect(
      buildEntityShareUrl({
        kind: 'video',
        entityId: 'VID-1',
        href: '/feed?type=video&item=video%3AVID-1',
        feedHref: '/feed?item=video%3AVID-1',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/video/VID-1`)
    expect(
      buildEntityShareUrl({
        kind: 'user',
        entityId: 'USR-9',
        href: '/users/USR-9/publications',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/user/USR-9`)
    vi.unstubAllEnvs()
  })

  it('falls back to site deep links when kind/id cannot build OG path', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
    expect(
      buildEntityShareUrl({
        href: '/feed?type=video&item=video%3AVID-1',
      }),
    ).toBe('https://moxtapp.ru/feed?type=video&item=video%3AVID-1')
    vi.unstubAllEnvs()
  })
})
