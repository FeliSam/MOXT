import { describe, expect, it } from 'vitest'
import { mergeStarsRolloutConfig } from './AdminStarsRolloutPanel.jsx'

describe('mergeStarsRolloutConfig', () => {
  it('fusionne le rollout sans écraser le reste de la config', () => {
    const next = mergeStarsRolloutConfig(
      { publish: { marketplace: 20 }, enabled: false, rolloutPercent: 0 },
      { enabled: true, rolloutPercent: 10, pilotUserIds: ['u1'] },
    )
    expect(next.publish.marketplace).toBe(20)
    expect(next.enabled).toBe(true)
    expect(next.rolloutPercent).toBe(10)
    expect(next.pilotUserIds).toEqual(['u1'])
  })
})
