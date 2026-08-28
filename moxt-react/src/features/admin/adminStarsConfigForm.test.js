import { describe, expect, it } from 'vitest'
import { mergePricingIntoConfig, pricingFormFromConfig } from './adminStarsConfigForm'

describe('adminStarsConfigForm', () => {
  it('builds form state from config', () => {
    const form = pricingFormFromConfig({
      monthlyBonusPool: { personal: 60, business: 150 },
      publish: { marketplace: 20, video: 25 },
    })
    expect(form.poolPersonal).toBe('60')
    expect(form.publish.marketplace).toBe('20')
  })

  it('merges pricing form into config while preserving rollout', () => {
    const next = mergePricingIntoConfig(
      { enabled: true, rolloutPercent: 0, pilotUserIds: ['abc'] },
      {
        ...pricingFormFromConfig(),
        poolPersonal: '40',
        publish: { marketplace: '22', jobs: '20', events: '20', parcel: '20', video: '25' },
      },
    )
    expect(next.enabled).toBe(true)
    expect(next.pilotUserIds).toEqual(['abc'])
    expect(next.monthlyBonusPool.personal).toBe(40)
    expect(next.publish.marketplace).toBe(22)
    expect(next.boostFormulas['24h'].cost.video).toBe(35)
  })
})
