import { describe, expect, it } from 'vitest'
import {
  canCancelDeletion,
  formatCountdown,
  isDeletionCoolingOff,
  resolveAccountStatusContext,
} from './accountLifecycleUtils.js'

describe('accountLifecycleUtils', () => {
  it('détecte la période de réflexion 24 h', () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const request = { status: 'requested', suspendAt: future }
    expect(isDeletionCoolingOff(request)).toBe(true)
    expect(canCancelDeletion(request)).toBe(true)
  })

  it('calcule un compte à rebours', () => {
    const target = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
    const countdown = formatCountdown(target)
    expect(countdown?.expired).toBe(false)
    expect(countdown?.days).toBe(1)
  })

  it('résout le contexte suspendu', () => {
    const ctx = resolveAccountStatusContext(
      { status: 'suspended', suspensionSource: 'deletion', purgeAt: '2099-01-01T00:00:00.000Z' },
      { status: 'requested', suspendAt: '2020-01-01T00:00:00.000Z' },
    )
    expect(ctx.suspended).toBe(true)
    expect(ctx.coolingOff).toBe(false)
  })
})
