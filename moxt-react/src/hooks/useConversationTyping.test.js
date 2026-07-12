import { describe, expect, it } from 'vitest'
import { shouldIgnoreTypingEvent, typingChannelName } from './useConversationTyping'

describe('useConversationTyping', () => {
  it('nomme le canal par conversation', () => {
    expect(typingChannelName('CONV-42')).toBe('typing:CONV-42')
  })

  it('ignore les événements sans userId ou émis par soi-même', () => {
    expect(shouldIgnoreTypingEvent(null, 'u1')).toBe(true)
    expect(shouldIgnoreTypingEvent({ userId: 'u1' }, 'u1')).toBe(true)
    expect(shouldIgnoreTypingEvent({ userId: 'u2' }, 'u1')).toBe(false)
  })
})
