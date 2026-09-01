import { describe, expect, it } from 'vitest'
import {
  buildSharePreviewUrl,
  pickShareImage,
  resolveInAppShareTarget,
  resolvePublicShareTarget,
  truncateShareText,
} from './shareLinkUtils.js'

describe('shareLinkUtils', () => {
  it('builds share preview url from supabase base', () => {
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

  it('shares marketplace links publicly but feed links for protected modules', () => {
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
    ).toBe('/feed?item=parcel%3APAR-1')

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

  it('builds feed fallback when only kind and id are known', () => {
    expect(
      resolvePublicShareTarget({
        kind: 'job',
        entityId: 'JOB-9',
        href: '/jobs/JOB-9',
      }),
    ).toBe('/feed?item=job%3AJOB-9')
  })

  it('picks first https image', () => {
    expect(pickShareImage(['', 'https://cdn.example/a.jpg'])).toBe('https://cdn.example/a.jpg')
  })

  it('truncates long descriptions', () => {
    expect(truncateShareText('a'.repeat(200), 20).endsWith('…')).toBe(true)
  })
})
