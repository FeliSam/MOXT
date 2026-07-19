import { describe, expect, it } from 'vitest'
import {
  parcelProofLabelKey,
  parcelProofTone,
  resolveParcelProofStatus,
} from './parcelProofUtils'

describe('parcelProofUtils', () => {
  it('resolve les etats de preuve', () => {
    expect(resolveParcelProofStatus({ proofStatus: 'verified' })).toBe('verified')
    expect(resolveParcelProofStatus({ proofStatus: 'rejected' })).toBe('rejected')
    expect(resolveParcelProofStatus({ proofStatus: 'pending_review' })).toBe('pending_review')
    expect(resolveParcelProofStatus({ travelProofUrl: 'https://x/p.pdf' })).toBe('pending_review')
    expect(resolveParcelProofStatus({})).toBe('missing')
  })

  it('expose label et tone', () => {
    expect(parcelProofLabelKey('missing')).toBe('parcels.card.proofMissing')
    expect(parcelProofTone('pending_review')).toBe('warning')
    expect(parcelProofTone('verified')).toBe('success')
  })
})
