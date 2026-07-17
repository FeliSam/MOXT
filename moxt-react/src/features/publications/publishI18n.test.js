import { describe, expect, it } from 'vitest'
import { PUBLISH_FR_SOURCES, publishText } from './publishI18n'

describe('publishI18n', () => {
  it('falls back to French sources when t echoes the key', () => {
    const t = (key) => key
    expect(publishText(t, 'publish.parcel.title')).toBe('Publier un voyage')
    expect(publishText(t, 'publish.parcel.review.capacityValue', { kg: 12 })).toBe('12 kg')
  })

  it('prefers a successful translation', () => {
    const t = (key) => (key === 'publish.job.title' ? 'Publish a job' : key)
    expect(publishText(t, 'publish.job.title')).toBe('Publish a job')
  })

  it('exposes a non-empty FR source map under publish.*', () => {
    const keys = Object.keys(PUBLISH_FR_SOURCES)
    expect(keys.length).toBeGreaterThan(100)
    expect(keys.every((key) => key.startsWith('publish.'))).toBe(true)
  })
})
