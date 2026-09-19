import { describe, expect, it } from 'vitest'
import {
  buildShareOgUrl,
  buildSharePreviewUrl,
  normalizeShareKind,
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

  it('normalizes colis and French plurals to canonical kinds', () => {
    expect(normalizeShareKind('colis')).toBe('parcel')
    expect(normalizeShareKind('Colis')).toBe('parcel')
    expect(normalizeShareKind('parcels')).toBe('parcel')
    expect(normalizeShareKind('evenements')).toBe('event')
    expect(normalizeShareKind('emplois')).toBe('job')
    expect(normalizeShareKind('annonces')).toBe('listing')
  })

  it('builds OG url with normalized colis alias', () => {
    expect(buildShareOgUrl({ kind: 'colis', entityId: 'COL-1' })).toBe(
      'https://share.moxtapp.ru/share/parcel/COL-1',
    )
  })
})
