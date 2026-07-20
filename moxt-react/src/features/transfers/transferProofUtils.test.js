import { describe, expect, it } from 'vitest'
import {
  buildReceiptProofsFromTransfer,
  buildTransferReceiptPayload,
  getTransferProofEntries,
  inferProofStoragePath,
} from './transferProofUtils'

describe('transferProofUtils', () => {
  const transfer = {
    id: 'MXT-ABC',
    userId: 'user-1',
    businessOwnerId: 'biz-owner-1',
    paymentProof: { name: 'paiement.pdf', url: 'https://example.com/p' },
    businessProof: { name: 'virement.jpg', path: 'biz-owner-1/MXT-ABC/business.jpg' },
    receivedProof: { name: 'recu.png' },
  }

  it('liste toutes les preuves du transfert', () => {
    const entries = getTransferProofEntries(transfer)
    expect(entries).toHaveLength(3)
    expect(entries.map((entry) => entry.kind)).toEqual(['payment', 'business', 'received'])
  })

  it('deduit le chemin de stockage si absent', () => {
    expect(inferProofStoragePath(transfer, 'payment', transfer.paymentProof)).toBe(
      'user-1/MXT-ABC/proof.pdf',
    )
    expect(inferProofStoragePath(transfer, 'received', transfer.receivedProof)).toBe(
      'user-1/MXT-ABC-receive/proof.png',
    )
  })

  it('prepare les preuves pour le recu', () => {
    const proofs = buildReceiptProofsFromTransfer(transfer)
    expect(proofs).toHaveLength(3)
    expect(proofs[0]).toMatchObject({ kind: 'payment', name: 'paiement.pdf' })
    expect(proofs[1].path).toBe('biz-owner-1/MXT-ABC/business.jpg')
  })

  it('n envoie pas titleKey comme colonne receipts', () => {
    const payload = buildTransferReceiptPayload({
      ...transfer,
      totalToPay: 1000,
      currencyFrom: 'XOF',
      status: 'payment_declared',
    })
    expect(payload).not.toHaveProperty('titleKey')
    expect(payload.title).toContain('MXT-ABC')
    expect(payload.details.titleKey).toBe('transfers.receipt.storedTitle')
  })
})
