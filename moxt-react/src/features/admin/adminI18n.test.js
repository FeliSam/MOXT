import { describe, expect, it } from 'vitest'
import { ADMIN_FR_SOURCES, adminOptionLabel, adminText } from './adminI18n'

describe('adminI18n', () => {
  it('falls back to French sources when t echoes the key', () => {
    const t = (key) => key
    expect(adminText(t, 'admin.page.title')).toBe('Centre de controle')
    expect(adminText(t, 'admin.kpi.transfers.sub', { count: 12 })).toBe('12 en cours')
  })

  it('prefers a successful translation', () => {
    const t = (key) => (key === 'admin.page.title' ? 'Control center' : key)
    expect(adminText(t, 'admin.page.title')).toBe('Control center')
  })

  it('falls back to the key itself when there is no source and no translation', () => {
    const t = (key) => key
    expect(adminText(t, 'admin.unknown.key')).toBe('admin.unknown.key')
  })

  it('works without a translation function', () => {
    expect(adminText(undefined, 'admin.actions.approve')).toBe('Valider')
  })

  it('resolves option labels via labelKey with a label fallback', () => {
    const t = (key) => key
    expect(adminOptionLabel(t, { labelKey: 'admin.actions.reject' })).toBe('Refuser')
    expect(adminOptionLabel(t, { label: 'Direct label' })).toBe('Direct label')
    expect(adminOptionLabel(t, null)).toBe('')
  })

  it('exposes a non-empty FR source map under admin.*', () => {
    const keys = Object.keys(ADMIN_FR_SOURCES)
    expect(keys.length).toBeGreaterThan(100)
    expect(keys.every((key) => key.startsWith('admin.'))).toBe(true)
  })
})
