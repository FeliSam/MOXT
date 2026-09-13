import { describe, expect, it } from 'vitest'
import { isPersistedConversationId } from './conversationPersist'

describe('isPersistedConversationId', () => {
  it('accepte un UUID supabase', () => {
    expect(isPersistedConversationId('a1b2c3d4-e5f6-47a8-9abc-def012345678')).toBe(true)
  })

  it('refuse les ids locaux CONV-', () => {
    expect(isPersistedConversationId('CONV-ABC123')).toBe(false)
    expect(isPersistedConversationId('')).toBe(false)
  })
})
