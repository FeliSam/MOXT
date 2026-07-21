import { describe, expect, it } from 'vitest'
import {
  buildTransferClaimReason,
  findMatchingTransferProfile,
  normalizeTransferProfilePhone,
  partyToTransferProfileInput,
} from './transferProfileFavorites'

describe('transferProfileFavorites', () => {
  it('normalise les téléphones pour la déduplication', () => {
    expect(normalizeTransferProfilePhone('+229 01 00 00 00')).toBe('22901000000')
  })

  it('trouve un profil favori existant par téléphone', () => {
    const match = findMatchingTransferProfile(
      [
        {
          id: 'TPRO1',
          userId: 'u1',
          phone: '+22901000000',
          firstName: 'Amina',
        },
      ],
      { phone: '229 01 00 00 00' },
      'u1',
    )
    expect(match?.id).toBe('TPRO1')
  })

  it('construit le payload favori et le motif de réclamation', () => {
    expect(
      partyToTransferProfileInput(
        { firstName: 'A', lastName: 'B', phone: '+2291', method: 'MTN' },
        { userId: 'u1', country: 'BJ' },
      ),
    ).toMatchObject({ userId: 'u1', country: 'BJ', method: 'MTN' })

    const reason = buildTransferClaimReason({
      motiveKey: 'delay',
      motiveLabel: 'Retard excessif',
      transferId: 'MXT-ABC',
      message: 'Toujours en attente',
    })
    expect(reason).toContain('[delay]')
    expect(reason).toContain('MXT-ABC')
    expect(reason).toContain('Toujours en attente')
  })
})
