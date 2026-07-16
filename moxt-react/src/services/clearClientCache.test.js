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

  it('ensureClientCacheVersion clears once then records version', () => {
    localStorage.setItem('moxt-account-v1', '{}')
    localStorage.setItem('moxt-theme', 'light')

    expect(ensureClientCacheVersion()).toBe(true)
    expect(localStorage.getItem('moxt-account-v1')).toBeNull()
    expect(localStorage.getItem('moxt-theme')).toBe('light')
    expect(localStorage.getItem('MOXT_CACHE_VERSION')).toBe(MOXT_CACHE_VERSION)

    localStorage.setItem('moxt-account-v1', '{}')
    expect(ensureClientCacheVersion()).toBe(false)
    expect(localStorage.getItem('moxt-account-v1')).toBe('{}')
  })
})
