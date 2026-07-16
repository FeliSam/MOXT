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

  it('maps hook_timeout to a clear SMS retry message', () => {
    expect(
      translateAuthError(
        {
          code: 'hook_timeout',
          status: 422,
          message: 'Failed to reach hook within maximum time of 5.000000 seconds',
        },
        { channel: 'phone' },
      ),
    ).toContain('trop de temps')
  })

  it('maps AuthRetryableFetchError empty payload to network retry (phone)', () => {
    expect(
      translateAuthError(
        { name: 'AuthRetryableFetchError', message: '{}', status: 500 },
        { channel: 'phone' },
      ),
    ).toMatch(/Connexion au serveur|réseau/i)
  })

  it('maps TypeError fetch failed to a clear network message (not opaque generic)', () => {
    const message = translateAuthError(
      { name: 'AuthRetryableFetchError', message: 'TypeError: fetch failed' },
      { channel: 'phone' },
    )
    expect(message).toMatch(/Connexion au serveur|réseau/i)
    expect(message).not.toBe('Une erreur est survenue. Veuillez réessayer.')
  })

  it('maps bare fetch failed without AuthRetryable name on phone channel', () => {
    expect(
      translateAuthError({ message: 'TypeError: fetch failed' }, { channel: 'phone' }),
    ).toMatch(/Connexion au serveur|réseau/i)
  })

  it('maps Supabase security cooldown to an explicit wait message', () => {
    expect(
      translateAuthError(
        { message: 'For security purposes, you can only request this after 60 seconds.' },
        { channel: 'phone' },
      ),
    ).toMatch(/Patientez au moins \d+ secondes/i)
  })

  it('never returns opaque generic for unrecognized phone-channel errors', () => {
    expect(
      translateAuthError({ message: 'some obscure provider glitch xyz' }, { channel: 'phone' }),
    ).toMatch(/SMS/i)
  })

  it('maps OTP verify failures to confirmation wording, not SMS send', () => {
    expect(
      translateAuthError(
        { code: 'otp_expired', message: 'Token has expired or is invalid' },
        { channel: 'phone', intent: 'otp_verify' },
      ),
    ).toMatch(/code est invalide|expiré/i)

    expect(
      translateAuthError(
        { message: 'some obscure provider glitch xyz' },
        { channel: 'phone', intent: 'otp_verify' },
      ),
    ).toMatch(/confirmer ce code/i)
  })
})
