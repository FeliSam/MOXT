import { describe, expect, it } from 'vitest'
import { useAppThemeScope } from './useAppThemeScope'

describe('useAppThemeScope', () => {
  it('exporte une fonction hook', () => {
    expect(typeof useAppThemeScope).toBe('function')
  })
})
