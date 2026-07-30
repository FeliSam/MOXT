import { describe, expect, it } from 'vitest'
import { MOXTI_API_URL, moxtiAssistantProvider } from './moxtiAssistantProvider'

describe('moxtiAssistantProvider', () => {
  it('exposes the documented AIS endpoint by default', () => {
    expect(MOXTI_API_URL).toContain('/api/messages/incoming')
  })

  it('rejects empty questions', async () => {
    await expect(moxtiAssistantProvider.respond({ question: '  ' })).rejects.toThrow(/vide/i)
  })
})
