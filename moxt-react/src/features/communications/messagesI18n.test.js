import { describe, expect, it } from 'vitest'
import { MESSAGES_FR_SOURCES, messagesText } from './messagesI18n.js'

describe('messagesI18n', () => {
  it('retourne la source FR quand t renvoie la clé', () => {
    expect(messagesText((key) => key, 'messages.empty.title')).toBe(
      MESSAGES_FR_SOURCES['messages.empty.title'],
    )
  })

  it('interpolates les variables', () => {
    expect(messagesText(null, 'messages.exchangeCount', { count: 3 })).toBe('3 échange(s)')
  })
})
