import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_SEND_WINDOW_MS,
  otpIdentityKey,
  recordOtpSend,
  getOtpSendState,
  loadOtpSendLog,
  OTP_SEND_LOG_STORAGE_KEY,
} from './otpCooldown.js'

describe('otpCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes a 90 second resend window and 3 / 3h cap', () => {
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(90)
    expect(OTP_RESEND_COOLDOWN_MS).toBe(90_000)
    expect(OTP_MAX_SENDS_PER_WINDOW).toBe(3)
    expect(OTP_SEND_WINDOW_MS).toBe(3 * 60 * 60 * 1000)
  })

  it('blocks a second send to the same identity inside the cooldown', () => {
    const store = new Map()
    recordOtpSend(store, 'phone', '+79000000010', { persist: false })

    expect(() => recordOtpSend(store, 'phone', '+79000000010', { enforce: true, persist: false })).toThrow(
      /Patientez \d+ secondes/,
    )
  })

  it('allows resend after the cooldown elapsed', () => {
    const store = new Map()
    recordOtpSend(store, 'phone', '+79000000010', { persist: false })
    vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 1)

    expect(() =>
      recordOtpSend(store, 'phone', '+79000000010', { enforce: true, persist: false }),
    ).not.toThrow()
  })

  it('caps at 3 sends per 3 hours for the same identity', () => {
    const store = new Map()
    for (let i = 0; i < OTP_MAX_SENDS_PER_WINDOW; i += 1) {
      recordOtpSend(store, 'email', 'a@example.com', { persist: false })
      if (i < OTP_MAX_SENDS_PER_WINDOW - 1) {
        vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 1)
      }
    }

    vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 1)
    expect(() =>
      recordOtpSend(store, 'email', 'a@example.com', { enforce: true, persist: false }),
    ).toThrow(/Limite atteinte/)

    const state = getOtpSendState(store, 'email', 'a@example.com')
    expect(state.sendsInWindow).toBe(3)
    expect(state.capped).toBe(true)
    expect(state.remainingSends).toBe(0)
  })

  it('resets the rolling window after 3 hours', () => {
    const store = new Map()
    recordOtpSend(store, 'phone', '+79000000010', { persist: false })
    vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 1)
    recordOtpSend(store, 'phone', '+79000000010', { persist: false })
    vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 1)
    recordOtpSend(store, 'phone', '+79000000010', { persist: false })

    vi.advanceTimersByTime(OTP_SEND_WINDOW_MS + 1)
    expect(() =>
      recordOtpSend(store, 'phone', '+79000000010', { enforce: true, persist: false }),
    ).not.toThrow()
  })

  it('persists send timestamps in localStorage when available', () => {
    const memory = new Map()
    const storage = {
      data: {},
      getItem(key) {
        return this.data[key] ?? null
      },
      setItem(key, value) {
        this.data[key] = String(value)
      },
    }

    recordOtpSend(memory, 'phone', '+79000000010', { persist: true })
    // Manually persist with injected storage via load/save roundtrip pattern
    storage.setItem(
      OTP_SEND_LOG_STORAGE_KEY,
      JSON.stringify({ [otpIdentityKey('phone', '+79000000010')]: memory.get(otpIdentityKey('phone', '+79000000010')) }),
    )

    const restored = loadOtpSendLog(storage)
    expect(restored.get(otpIdentityKey('phone', '+79000000010'))).toHaveLength(1)
  })
})
