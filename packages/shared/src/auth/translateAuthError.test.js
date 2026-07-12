import { describe, expect, it } from 'vitest'
import { translateAuthError } from './translateAuthError.js'

describe('translateAuthError', () => {
  it('maps phone signup 500 errors to SMS messages, not email', () => {
    const message = translateAuthError(
      { status: 500, code: 'unexpected_failure', message: 'Hook error sending confirmation SMS' },
      { channel: 'phone' },
    )
    expect(message.toLowerCase()).toContain('sms')
    expect(message.toLowerCase()).not.toContain('e-mail est indisponible')
  })

  it('maps phone verification duplicate to a clear message', () => {
    const message = translateAuthError(
      { code: 'phone_exists', message: 'Phone already registered' },
      { channel: 'phone', intent: 'phone_verification' },
    )
    expect(message).toContain('autre compte MOXT')
  })
})
