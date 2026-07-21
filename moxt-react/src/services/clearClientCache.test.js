import { beforeEach, describe, expect, it } from 'vitest'
import { OTP_SEND_LOG_STORAGE_KEY } from '@moxt/shared/auth/otpCooldown.js'
import { PENDING_REGISTRATION_KEY } from '@moxt/shared/auth/pendingRegistration.js'
import {
  MOXT_CACHE_VERSION,
  clearClientCache,
  ensureClientCacheVersion,
} from './clearClientCache'

describe('clearClientCache', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('wipes moxt user caches but keeps theme and language', () => {
    localStorage.setItem('moxt-theme', 'dark')
    localStorage.setItem('moxt-language', 'fr')
    localStorage.setItem('moxt-notifications-v1', '[]')
    localStorage.setItem('moxt-account-v1', '{}')
    localStorage.setItem(OTP_SEND_LOG_STORAGE_KEY, '{}')
    sessionStorage.setItem(PENDING_REGISTRATION_KEY, '{"method":"phone"}')

    const removed = clearClientCache({ scope: 'full' })

    expect(localStorage.getItem('moxt-theme')).toBe('dark')
    expect(localStorage.getItem('moxt-language')).toBe('fr')
    expect(localStorage.getItem('moxt-notifications-v1')).toBeNull()
    expect(localStorage.getItem('moxt-account-v1')).toBeNull()
    expect(localStorage.getItem(OTP_SEND_LOG_STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(PENDING_REGISTRATION_KEY)).toBeNull()
    expect(removed).toEqual(expect.arrayContaining(['moxt-notifications-v1', 'moxt-account-v1']))
  })

  it('auth scope clears OTP and pending registration only', () => {
    localStorage.setItem('moxt-notifications-v1', '[]')
    localStorage.setItem(OTP_SEND_LOG_STORAGE_KEY, '{}')
    sessionStorage.setItem(PENDING_REGISTRATION_KEY, '{"method":"email"}')

    clearClientCache({ scope: 'auth' })

    expect(localStorage.getItem('moxt-notifications-v1')).toBe('[]')
    expect(localStorage.getItem(OTP_SEND_LOG_STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(PENDING_REGISTRATION_KEY)).toBeNull()
  })

  it('ensureClientCacheVersion clears app caches but preserves auth tokens', () => {
    localStorage.setItem('moxt-account-v1', '{}')
    localStorage.setItem('moxt-theme', 'light')
    localStorage.setItem('sb-xxxxx-auth-token', '{"access_token":"keep"}')

    expect(ensureClientCacheVersion()).toBe(true)
    expect(localStorage.getItem('moxt-account-v1')).toBeNull()
    expect(localStorage.getItem('moxt-theme')).toBe('light')
    expect(localStorage.getItem('sb-xxxxx-auth-token')).toBe('{"access_token":"keep"}')
    expect(localStorage.getItem('MOXT_CACHE_VERSION')).toBe(MOXT_CACHE_VERSION)

    localStorage.setItem('moxt-account-v1', '{}')
    expect(ensureClientCacheVersion()).toBe(false)
    expect(localStorage.getItem('moxt-account-v1')).toBe('{}')
  })

  it('full clear without preserveAuth removes supabase auth keys', () => {
    localStorage.setItem('sb-xxxxx-auth-token', '{"access_token":"x"}')
    clearClientCache({ scope: 'full' })
    expect(localStorage.getItem('sb-xxxxx-auth-token')).toBeNull()
  })

  it('full clear with preserveAuth keeps supabase auth keys', () => {
    localStorage.setItem('sb-xxxxx-auth-token', '{"access_token":"x"}')
    clearClientCache({ scope: 'full', preserveAuth: true })
    expect(localStorage.getItem('sb-xxxxx-auth-token')).toBe('{"access_token":"x"}')
  })
})
