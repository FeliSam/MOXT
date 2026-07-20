import { describe, expect, it } from 'vitest'
import {
  isSmsNumberProviderDenied,
  SMS_NUMBER_PROVIDER_DENIED,
  translateAuthError,
} from './translateAuthError.js'
import { OTP_RESEND_COOLDOWN_SECONDS } from './otpCooldown.js'

describe('isSmsNumberProviderDenied', () => {
  it('detects SMSC number denied and message is denied', () => {
    expect(isSmsNumberProviderDenied('SMSC_NUMBER_DENIED — message is denied')).toBe(true)
    expect(isSmsNumberProviderDenied({ message: 'Message is denied' })).toBe(true)
    expect(
      isSmsNumberProviderDenied({
        message: 'SMSC : envoi refusé pour ce numéro. Vérifiez le mode test',
      }),
    ).toBe(true)
  })

  it('ignores balance, timeout, rate limit and sender-only errors', () => {
    expect(isSmsNumberProviderDenied('SMSC : solde insuffisant. Rechargez')).toBe(false)
    expect(isSmsNumberProviderDenied({ code: 'hook_timeout', message: 'Failed to reach hook' })).toBe(
      false,
    )
    expect(isSmsNumberProviderDenied({ code: 'over_sms_send_rate_limit', message: 'rate' })).toBe(
      false,
    )
    expect(isSmsNumberProviderDenied('SMSC_SENDER_INVALID — bad sender')).toBe(false)
  })

  it('treats sms_send_failed as denied only with operator wording', () => {
    expect(
      isSmsNumberProviderDenied({ code: 'sms_send_failed', message: 'failed' }),
    ).toBe(false)
    expect(
      isSmsNumberProviderDenied({
        code: 'sms_send_failed',
        message: 'Operator denied delivery',
      }),
    ).toBe(true)
  })

  it('exports stable machine code', () => {
    expect(SMS_NUMBER_PROVIDER_DENIED).toBe('SMS_NUMBER_PROVIDER_DENIED')
  })
})

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

  it('maps AuthRetryableFetchError empty 500 payload to SMS hook failure (not VPN)', () => {
    const message = translateAuthError(
      { name: 'AuthRetryableFetchError', message: '{}', status: 500 },
      { channel: 'phone', intent: 'register' },
    )
    expect(message).toMatch(/SMS|envoi/i)
    expect(message).not.toMatch(/VPN/i)
    expect(message).not.toMatch(/nouveau code/i)
  })

  it('maps TypeError fetch failed to a clear network message (not opaque generic)', () => {
    const message = translateAuthError(
      { name: 'AuthRetryableFetchError', message: 'TypeError: fetch failed' },
      { channel: 'phone' },
    )
    expect(message).toMatch(/Connexion au serveur|réseau/i)
    expect(message).not.toBe('Une erreur est survenue. Veuillez réessayer.')
    expect(message).not.toMatch(/nouveau code/i)
  })

  it('maps bare fetch failed without AuthRetryable name on phone channel', () => {
    const message = translateAuthError(
      { message: 'TypeError: fetch failed' },
      { channel: 'phone' },
    )
    expect(message).toMatch(/Connexion au serveur|réseau/i)
    expect(message).not.toMatch(/nouveau code/i)
  })

  it('keeps OTP-specific network wording only while verifying a code', () => {
    expect(
      translateAuthError(
        { message: 'TypeError: fetch failed' },
        { channel: 'phone', intent: 'otp_verify' },
      ),
    ).toMatch(/confirmer le code|nouveau code/i)
  })

  it('maps register connect-timeout to a network message (not SMS, not VPN blame)', () => {
    const message = translateAuthError(
      {
        message: 'fetch failed',
        cause: { code: 'UND_ERR_CONNECT_TIMEOUT', message: 'Connect Timeout Error' },
      },
      { channel: 'phone', intent: 'register' },
    )
    expect(message).toMatch(/inscription|connexion|réseau/i)
    expect(message).not.toMatch(/VPN/i)
    expect(message).not.toMatch(/SMS est temporairement/i)
  })

  it('maps Supabase security cooldown to an explicit wait message', () => {
    const result = translateAuthError(
      { message: 'For security purposes, you can only request this after 60 seconds.' },
      { channel: 'phone' },
    )
    if (OTP_RESEND_COOLDOWN_SECONDS > 0) {
      expect(result).toMatch(/Patientez au moins \d+ secondes/i)
    } else {
      expect(result).toMatch(/Trop de tentatives/i)
    }
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
