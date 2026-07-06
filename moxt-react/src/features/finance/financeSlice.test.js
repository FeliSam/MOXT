import { describe, expect, it } from 'vitest'
import reducer, { addWalletEntry, createReceipt, createSimulatedPayment } from './financeSlice'

const emptyState = { payments: [], receipts: [], walletEntries: [] }

describe('finance simulation', () => {
  it('marque toujours les écritures comme simulées', () => {
    const payment = reducer(
      emptyState,
      createSimulatedPayment({
        userId: 'u1',
        relatedType: 'transfer',
        relatedId: 't1',
        amount: 100,
        currency: 'XOF',
      }),
    )
    const receipt = reducer(
      payment,
      createReceipt({
        userId: 'u1',
        relatedType: 'transfer',
        relatedId: 't1',
        title: 'Reçu',
        amount: 100,
        currency: 'XOF',
      }),
    )
    const wallet = reducer(
      receipt,
      addWalletEntry({
        userId: 'u1',
        direction: 'out',
        amount: 100,
        currency: 'XOF',
        label: 'Simulation',
      }),
    )
    expect(wallet.payments[0].simulation).toBe(true)
    expect(wallet.receipts[0].simulation).toBe(true)
    expect(wallet.walletEntries[0].simulation).toBe(true)
  })
})
