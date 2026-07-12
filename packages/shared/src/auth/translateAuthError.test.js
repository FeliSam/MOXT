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
    expect(message.toLowerCase()).not.toContain('smsc')
    expect(message.toLowerCase()).not.toContain('npm run')
  })

  it('uses production-friendly SMS errors without admin jargon', () => {
    expect(translateAuthError({ code: 'phone_provider_disabled', message: 'disabled' })).not.toMatch(
      /npm run|supabase|smsc/i,
    )
    expect(translateAuthError({ code: 'sms_send_failed', message: 'failed' })).not.toMatch(
      /mode test|smsc/i,
    )
    expect(
      translateAuthError(
        { status: 500, code: 'unexpected_failure', message: 'smsc mode test blocked' },
        { channel: 'phone' },
      ),
    ).not.toMatch(/smsc\.ru|mode test/i)
  })

  it('maps phone verification duplicate to a clear message', () => {
    const message = translateAuthError(
      { code: 'phone_exists', message: 'Phone already registered' },
      { channel: 'phone', intent: 'phone_verification' },
    )
    expect(message).toContain('autre compte MOXT')
  })
})
