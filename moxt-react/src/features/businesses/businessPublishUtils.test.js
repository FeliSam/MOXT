import { describe, expect, it } from 'vitest'
import {
  businessDeclaresService,
  businessServicePublishBlockedMessageKey,
  canPublishAsBusinessFor,
  canRepublishBusinessItem,
  isBusinessPublishReady,
  PUBLISH_CONTENT_TYPE_SERVICES,
  resolveBusinessPublishContext,
} from './businessPublishUtils'

describe('businessPublishUtils', () => {
  const verifiedBusiness = {
    id: 'BIZ-1',
    status: 'verified',
    services: ['Transfert', 'Colis'],
  }

  it('autorise la publication entreprise uniquement si verifiee', () => {
    expect(isBusinessPublishReady(verifiedBusiness)).toBe(true)
    expect(isBusinessPublishReady({ id: 'BIZ-2', status: 'pending_review' })).toBe(false)
  })

  it('mappe les types de contenu vers les services declares', () => {
    expect(PUBLISH_CONTENT_TYPE_SERVICES).toMatchObject({
      listing: 'Marketplace',
      parcel: 'Colis',
      job: 'Jobs',
      event: 'Events',
      p2p: 'P2P',
    })
  })

  it('detecte les modules declares sur l entreprise', () => {
    expect(businessDeclaresService(verifiedBusiness, 'Colis')).toBe(true)
    expect(businessDeclaresService(verifiedBusiness, 'Jobs')).toBe(false)
    expect(businessDeclaresService(null, 'Jobs')).toBe(false)
  })

  it('autorise publish-as-business seulement si statut + service', () => {
    expect(canPublishAsBusinessFor(verifiedBusiness, 'parcel')).toBe(true)
    expect(canPublishAsBusinessFor(verifiedBusiness, 'job')).toBe(false)
    expect(canPublishAsBusinessFor(verifiedBusiness, 'listing')).toBe(false)
    expect(
      canPublishAsBusinessFor(
        { ...verifiedBusiness, services: ['Marketplace'] },
        'listing',
      ),
    ).toBe(true)
    expect(
      canPublishAsBusinessFor({ id: 'BIZ-2', status: 'pending_review', services: ['Jobs'] }, 'job'),
    ).toBe(false)
  })

  it('expose une cle i18n quand le service n est pas declare', () => {
    expect(businessServicePublishBlockedMessageKey(verifiedBusiness, 'job')).toBe(
      'publish.common.business.serviceNotDeclared',
    )
    expect(businessServicePublishBlockedMessageKey(verifiedBusiness, 'parcel')).toBeNull()
    expect(
      businessServicePublishBlockedMessageKey(
        { ...verifiedBusiness, status: 'pending_review' },
        'job',
      ),
    ).toBeNull()
  })

  it('bloque la publication entreprise si le statut est insuffisant', () => {
    expect(
      resolveBusinessPublishContext({
        business: { id: 'BIZ-2', status: 'pending_review' },
        publishAsBusiness: true,
      }),
    ).toMatchObject({ blocked: true, businessId: null, reason: 'status' })
  })

  it('bloque la publication entreprise si le service n est pas declare', () => {
    expect(
      resolveBusinessPublishContext({
        business: verifiedBusiness,
        publishAsBusiness: true,
        contentType: 'job',
      }),
    ).toMatchObject({ blocked: true, businessId: null, reason: 'service' })
  })

  it('autorise la republication des contenus entreprise verifies', () => {
    const map = new Map([['BIZ-1', verifiedBusiness]])
    expect(canRepublishBusinessItem({ businessId: 'BIZ-1' }, map)).toBe(true)
    expect(canRepublishBusinessItem({ businessId: 'BIZ-2' }, map)).toBe(false)
    expect(canRepublishBusinessItem({ businessId: null }, map)).toBe(true)
  })
})
