import { describe, expect, it } from 'vitest'
import { getMobileHeaderActions } from './Header.jsx'

describe('getMobileHeaderActions', () => {
  it('masque Actualités si le fil est aussi actif', () => {
    const actions = getMobileHeaderActions('/dashboard', {
      canFeed: true,
      canNews: true,
    })
    expect(actions.showNews).toBe(false)
    expect(actions.showFeed).toBe(true)
  })

  it('affiche Actualités si son module est on et le fil est off', () => {
    const actions = getMobileHeaderActions('/dashboard', {
      canFeed: false,
      canNews: true,
    })
    expect(actions.showNews).toBe(true)
    expect(actions.showFeed).toBe(false)
  })
})
