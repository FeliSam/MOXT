import { describe, expect, it } from 'vitest'
import {
  canRepublishBusinessItem,
  isBusinessPublishReady,
  resolveBusinessPublishContext,
} from './businessPublishUtils'

describe('businessPublishUtils', () => {
  const verifiedBusiness = { id: 'BIZ-1', status: 'verified' }

  it('autorise la publication entreprise uniquement si verifiee', () => {
    expect(isBusinessPublishReady(verifiedBusiness)).toBe(true)
    expect(isBusinessPublishReady({ id: 'BIZ-2', status: 'pending_review' })).toBe(false)
  })

  it('bloque la publication entreprise si le statut est insuffisant', () => {
    expect(
      resolveBusinessPublishContext({
        business: { id: 'BIZ-2', status: 'pending_review' },
        publishAsBusiness: true,
      }),
    ).toMatchObject({ blocked: true, businessId: null })
  })

  it('autorise la republication des contenus entreprise verifies', () => {
    const map = new Map([['BIZ-1', verifiedBusiness]])
    expect(canRepublishBusinessItem({ businessId: 'BIZ-1' }, map)).toBe(true)
    expect(canRepublishBusinessItem({ businessId: 'BIZ-2' }, map)).toBe(false)
    expect(canRepublishBusinessItem({ businessId: null }, map)).toBe(true)
  })
})
