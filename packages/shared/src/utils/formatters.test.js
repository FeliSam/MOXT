import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDateTime,
  formatFileSize,
  formatShortDate,
} from './formatters.js'

describe('localized formatters', () => {
  it('accepte les codes de langue courts de MOXT', () => {
    expect(formatShortDate('2026-07-17T12:00:00Z', 'ru')).toMatch(/2026/)
    expect(formatCurrency(1500, 'RUB', 'ru')).toContain('₽')
  })

  it('utilise les unités russes pour les fichiers', () => {
    expect(formatFileSize(1024, 'ru')).toContain('КБ')
  })

  it('retourne un symbole neutre pour une date invalide', () => {
    expect(formatDateTime('invalide', 'en')).toBe('—')
  })
})
