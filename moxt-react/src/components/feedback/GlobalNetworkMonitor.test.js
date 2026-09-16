import { describe, expect, it } from 'vitest'
import { shouldCloseNetworkModal, shouldIgnoreOfflineSignal } from './networkMonitor'

describe('GlobalNetworkMonitor offline gating', () => {
  it('ignore un offline pendant que l app est en arrière-plan', () => {
    expect(shouldIgnoreOfflineSignal({ visibilityState: 'hidden' })).toBe(true)
    expect(shouldIgnoreOfflineSignal({ visibilityState: 'visible' })).toBe(false)
  })

  it('ferme la modale dès que le navigateur est en ligne', () => {
    expect(shouldCloseNetworkModal({ onLine: true })).toBe(true)
    expect(shouldCloseNetworkModal({ onLine: false })).toBe(false)
  })
})
