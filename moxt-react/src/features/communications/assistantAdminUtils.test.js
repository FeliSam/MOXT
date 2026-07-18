import { describe, expect, it } from 'vitest'
import { wantsAdminContact } from './assistantAdminUtils'

describe('assistantAdminUtils', () => {
  it('detects admin contact intent in French and English', () => {
    expect(wantsAdminContact('Je veux parler avec un administrateur', 'fr')).toBe(true)
    expect(wantsAdminContact('I need to speak with a human agent', 'en')).toBe(true)
    expect(wantsAdminContact('Comment envoyer un colis ?', 'fr')).toBe(false)
  })
})
