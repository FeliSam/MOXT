import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('builds stable business share urls with version query', () => {
    const first = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const second = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(first).toBe(second)
    expect(first).toContain('https://moxtapp.ru/businesses/BIZ-1')
    expect(first).toContain('v=')
  })

  it('prefers share-preview URL when supabase is configured', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    const url = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(url).toBe('https://abc.supabase.co/functions/v1/share-preview/business/BIZ-1')
  })

  it('builds share url from form values', () => {
    const url = buildBusinessShareUrlFromValues({
      id: 'BIZ-2',
      name: 'Beta',
    })
    expect(url).toContain('/businesses/BIZ-2')
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
