import { describe, expect, it } from 'vitest'
import {
  CANONICAL_SHARE_SITE,
  buildShareOgUrl,
  buildSharePreviewUrl,
  normalizeShareKind,
  pickShareImage,
  resolveInAppShareTarget,
  resolvePublicShareTarget,
  truncateShareText,
} from './shareLinkUtils.js'

describe('shareLinkUtils', () => {

  it('normalizes relatedType aliases to singular share kinds', () => {
    expect(normalizeShareKind('profile')).toBe('user')
    expect(normalizeShareKind('listings')).toBe('listing')
    expect(normalizeShareKind('videos')).toBe('video')
    expect(normalizeShareKind('posts')).toBe('post')
    expect(normalizeShareKind('listing')).toBe('listing')
    expect(
      buildShareOgUrl({ kind: 'profile', entityId: 'USR-1' }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/user/USR-1`)
  })

  it('builds share OG url on the canonical gateway host', () => {
    expect(
      buildShareOgUrl({
        kind: 'listing',
        entityId: 'ANN-1',
      }),
    ).toBe(`${CANONICAL_SHARE_SITE}/share/listing/ANN-1`)
  })

  it('still builds direct supabase share-preview urls for debugging', () => {
    expect(
      buildSharePreviewUrl({
        kind: 'listing',
        entityId: 'ANN-1',
        supabaseUrl: 'https://abc.supabase.co',
      }),
    ).toBe('https://abc.supabase.co/functions/v1/share-preview/listing/ANN-1')
  })

  it('prefers public href over feed href for in-app navigation', () => {
    expect(
      resolveInAppShareTarget({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing:ANN-1',
      }),
    ).toBe('/marketplace/ANN-1')
  })

  it('shares catalog detail paths publicly when href is a public prefix', () => {
    expect(
      resolvePublicShareTarget({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing%3AANN-1',
      }),
    ).toBe('/marketplace/ANN-1')

    expect(
      resolvePublicShareTarget({
        kind: 'parcel',
        entityId: 'PAR-1',
        href: '/parcels/PAR-1',
        feedHref: '/feed?item=parcel%3APAR-1',
      }),
    ).toBe('/parcels/PAR-1')

    expect(
      resolvePublicShareTarget({
        kind: 'post',
        entityId: 'POST-1',
        href: '/news/POST-1',
        feedHref: '/feed?item=post%3APOST-1',
      }),
    ).toBe('/feed?item=post%3APOST-1')

    expect(
      resolvePublicShareTarget({
        kind: 'video',
        entityId: 'VID-1',
        href: '/feed?type=video&item=video%3AVID-1',
        feedHref: '/feed?item=video%3AVID-1',
      }),
    ).toBe('/feed?type=video&item=video%3AVID-1')
  })

  it('builds catalog path when only kind and id are known', () => {
    expect(
      resolvePublicShareTarget({
        kind: 'job',
        entityId: 'JOB-9',
        href: '/jobs/JOB-9',
      }),
    ).toBe('/jobs/JOB-9')
  })

  it('picks first https image', () => {
    expect(pickShareImage(['', 'https://cdn.example/a.jpg'])).toBe('https://cdn.example/a.jpg')
  })

  it('truncates long descriptions', () => {
    expect(truncateShareText('a'.repeat(200), 20).endsWith('…')).toBe(true)
  })
})
