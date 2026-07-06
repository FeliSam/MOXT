import { beforeEach, describe, expect, it } from 'vitest'
import { clearSearchHistory, readSearchHistory, saveSearchTerm } from './searchHistory'

describe('searchHistory', () => {
  beforeEach(() => localStorage.clear())

  it('dedoublonne et limite les recherches recentes', () => {
    ;['colis', 'emploi', 'studio', 'atelier', 'entreprise', 'COLIS'].forEach(saveSearchTerm)
    expect(readSearchHistory()).toEqual(['COLIS', 'entreprise', 'atelier', 'studio', 'emploi'])
  })

  it('peut etre efface', () => {
    saveSearchTerm('Cotonou')
    clearSearchHistory()
    expect(readSearchHistory()).toEqual([])
  })
})
