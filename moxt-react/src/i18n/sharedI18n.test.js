import { describe, expect, it } from 'vitest'
import { SHARED_FR_SOURCES, sharedText, STATUS_LABEL_KEYS } from './sharedI18n'

describe('sharedI18n', () => {
  it('falls back to French sources when t echoes the key', () => {
    const t = (key) => key
    expect(sharedText(t, 'shared.contact')).toBe('Contacter')
    expect(sharedText(t, 'statuses.pending')).toBe('En attente')
    expect(
      sharedText(t, 'shared.notifications.review.createdBody', {
        name: 'Ada',
        rating: 5,
        comment: 'Top',
      }),
    ).toBe('Ada a laissé 5/5 : « Top »')
  })

  it('prefers a successful translation', () => {
    const t = (key) => (key === 'shared.contact' ? 'Contact' : key)
    expect(sharedText(t, 'shared.contact')).toBe('Contact')
  })

  it('exposes status label keys for every STATUS_META entry', () => {
    expect(Object.keys(STATUS_LABEL_KEYS).length).toBeGreaterThan(20)
    expect(STATUS_LABEL_KEYS.pending_review).toBe('statuses.pendingReview')
  })

  it('exposes a non-empty FR source map under shared.* / statuses.*', () => {
    const keys = Object.keys(SHARED_FR_SOURCES)
    expect(keys.length).toBeGreaterThan(80)
    expect(
      keys.every((key) => key.startsWith('shared.') || key.startsWith('statuses.')),
    ).toBe(true)
  })
})
