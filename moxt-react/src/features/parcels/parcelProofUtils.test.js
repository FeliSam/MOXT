import { describe, expect, it } from 'vitest'
import {
  initialParcelDocStatus,
  parcelPassportLabelKey,
  parcelProofLabelKey,
  parcelProofTone,
  resolveParcelPassportStatus,
  resolveParcelProofStatus,
} from './parcelProofUtils'

describe('parcelProofUtils', () => {
  it('resolve les etats de billet', () => {
    expect(resolveParcelProofStatus({ proofStatus: 'verified' })).toBe('verified')
    expect(resolveParcelProofStatus({ proofStatus: 'rejected' })).toBe('rejected')
    expect(resolveParcelProofStatus({ proofStatus: 'pending_review' })).toBe('pending_review')
    expect(resolveParcelProofStatus({ travelProofUrl: 'https://x/p.pdf' })).toBe('pending_review')
    expect(resolveParcelProofStatus({ proofStatus: 'missing' })).toBe('missing')
    expect(resolveParcelProofStatus({})).toBe('missing')
  })

  it('resolve les etats de passeport', () => {
    expect(resolveParcelPassportStatus({ passportStatus: 'verified' })).toBe('verified')
    expect(resolveParcelPassportStatus({ passportProofUrl: 'path' })).toBe('pending_review')
    expect(resolveParcelPassportStatus({})).toBe('missing')
  })

  it('expose label et tone', () => {
    expect(parcelProofLabelKey('missing')).toBe('parcels.card.proofMissing')
    expect(parcelPassportLabelKey('verified')).toBe('parcels.card.passportVerified')
    expect(parcelProofTone('pending_review')).toBe('warning')
    expect(parcelProofTone('verified')).toBe('success')
    expect(initialParcelDocStatus(true)).toBe('pending_review')
    expect(initialParcelDocStatus(false)).toBe('missing')
  })
})
