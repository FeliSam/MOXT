import { describe, expect, it } from 'vitest'
import { buildAssistantContextPack, buildTransferCandidates } from './assistantContext'

describe('assistantContext', () => {
  it('collecte transferts actifs et candidats navigation', () => {
    const state = {
      businesses: { items: [] },
      transfers: {
        items: [
          {
            id: 'MXT-1',
            userId: 'u1',
            status: 'pending_payment',
            amountSent: 10000,
            currencyFrom: 'XOF',
            createdAt: '2026-08-01T00:00:00Z',
          },
          {
            id: 'MXT-2',
            userId: 'u1',
            status: 'completed',
            amountSent: 5000,
            currencyFrom: 'XOF',
            createdAt: '2026-07-01T00:00:00Z',
          },
        ],
      },
    }
    const pack = buildAssistantContextPack({
      state,
      question: 'Où en est mon transfert ?',
      user: { id: 'u1' },
      searchIndex: [],
    })
    expect(pack.toolsUsed).toContain('list_my_transfers')
    expect(pack.transfers.some((t) => t.id === 'MXT-1')).toBe(true)
    const candidates = buildTransferCandidates(pack)
    expect(candidates[0].path).toBe('/transfers/MXT-1')
  })

  it('détecte un id de transfert dans la question', () => {
    const state = {
      businesses: { items: [] },
      transfers: {
        items: [
          {
            id: 'MXT-99',
            userId: 'u1',
            status: 'payment_declared',
            createdAt: '2026-08-01T00:00:00Z',
          },
        ],
      },
    }
    const pack = buildAssistantContextPack({
      state,
      question: 'Statut de MXT-99 please',
      user: { id: 'u1' },
      searchIndex: [],
    })
    expect(pack.focusedTransfer?.id).toBe('MXT-99')
    expect(pack.toolsUsed).toContain('get_transfer')
  })
})
