import { describe, expect, it } from 'vitest'
import reducer, { addDisputeEvidence, openDispute } from './disputeSlice'

describe('disputes', () => {
  it('évite les litiges ouverts en double et conserve les métadonnées de preuve', () => {
    const action = openDispute({
      openedBy: 'u1',
      relatedType: 'p2p_order',
      relatedId: 'o1',
      reason: 'Paiement non reçu',
    })
    const first = reducer({ items: [] }, action)
    const duplicate = reducer(first, action)
    const withEvidence = reducer(
      duplicate,
      addDisputeEvidence({ id: first.items[0].id, name: 'preuve.pdf', size: 50, type: 'pdf' }),
    )
    expect(withEvidence.items).toHaveLength(1)
    expect(withEvidence.items[0].evidence[0].name).toBe('preuve.pdf')
  })
})
