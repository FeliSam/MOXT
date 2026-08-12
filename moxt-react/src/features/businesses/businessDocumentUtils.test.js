import { describe, expect, it } from 'vitest'
import {
  enrichBusinessDocument,
  parseBusinessIdFromStoragePath,
  resolveDocumentBusinessId,
} from './businessDocumentUtils'

describe('businessDocumentUtils', () => {
  it('parse le business id depuis le chemin storage', () => {
    expect(
      parseBusinessIdFromStoragePath(
        'uid-1/business/BIZ-ABC/identity/1700000000000-passport.jpg',
      ),
    ).toBe('BIZ-ABC')
  })

  it('rattache le document à l entreprise du chemin storage', () => {
    const businesses = [
      { id: 'BIZ-ABC', ownerId: 'USER-1', name: 'Alpha' },
      { id: 'BIZ-XYZ', ownerId: 'USER-2', name: 'Beta' },
    ]
    const document = {
      id: 'BDOC-1',
      businessId: 'BIZ-XYZ',
      ownerId: 'USER-1',
      storagePath: 'USER-1/business/BIZ-ABC/identity/1700000000000-passport.jpg',
    }
    expect(resolveDocumentBusinessId(document, businesses)).toBe('BIZ-ABC')
    expect(enrichBusinessDocument(document, businesses).businessId).toBe('BIZ-ABC')
  })
})
