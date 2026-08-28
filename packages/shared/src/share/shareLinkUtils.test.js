import { describe, expect, it } from 'vitest'
import {
  buildSharePreviewUrl,
  pickShareImage,
  resolveInAppShareTarget,
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

  it('prefers public href over feed href', () => {
    expect(
      resolveInAppShareTarget({
        kind: 'listing',
        entityId: 'ANN-1',
        href: '/marketplace/ANN-1',
        feedHref: '/feed?item=listing:ANN-1',
      }),
    ).toBe('/marketplace/ANN-1')
  })

  it('picks first https image', () => {
    expect(pickShareImage(['', 'https://cdn.example/a.jpg'])).toBe('https://cdn.example/a.jpg')
  })

  it('truncates long descriptions', () => {
    expect(truncateShareText('a'.repeat(200), 20).endsWith('…')).toBe(true)
  })
})
