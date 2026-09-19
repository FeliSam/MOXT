import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  buildBusinessShareUrlFromValues,
} from './businessShareUtils.js'

describe('businessShareUtils', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
  })

  it('builds stable business share urls via /share', () => {
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
    expect(first).toBe('https://www.moxtapp.ru/share/business/BIZ-1')
  })

  it('prefers /share URL on www.moxtapp.ru', () => {
    const url = buildBusinessShareUrl({
      id: 'BIZ-1',
      name: 'Alpha',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(url).toBe('https://www.moxtapp.ru/share/business/BIZ-1')
  })

  it('builds share url from form values', () => {
    const url = buildBusinessShareUrlFromValues({
      id: 'BIZ-2',
      name: 'Beta',
    })
    expect(url).toBe('https://www.moxtapp.ru/share/business/BIZ-2')
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
