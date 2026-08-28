import { describe, expect, it } from 'vitest'
import { canPublishAsBusinessFor } from '../businesses/businessPublishUtils'

describe('video publish gate', () => {
  it('autorise une entreprise vérifiée avec Marketplace', () => {
    expect(
      canPublishAsBusinessFor(
        { id: 'B1', status: 'verified', services: ['Marketplace'] },
        'video',
      ),
    ).toBe(true)
  })

  it('refuse sans entreprise ou sans module Marketplace', () => {
    expect(canPublishAsBusinessFor(null, 'video')).toBe(false)
    expect(
      canPublishAsBusinessFor({ id: 'B1', status: 'verified', services: ['Jobs'] }, 'video'),
    ).toBe(false)
    expect(
      canPublishAsBusinessFor({ id: 'B1', status: 'pending_review', services: ['Marketplace'] }, 'video'),
    ).toBe(false)
  })
})
