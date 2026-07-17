import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDateTime, formatFileSize, formatShortDate } from './formatters'

describe('formatters', () => {
  it('formate les montants et les tailles de manière stable', () => {
    expect(formatCurrency(1000, 'XOF')).toContain('1')
    expect(formatFileSize(1024)).toBe('1 Ko')
  })

  it('gère les dates invalides sans faire échouer la page', () => {
    // Placeholder neutre (indépendant de la langue) depuis la migration i18n.
    expect(formatDateTime('invalid')).toBe('—')
    expect(formatShortDate(null)).not.toBe('')
  })
})
