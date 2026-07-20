import { describe, expect, it } from 'vitest'
import {
  validateReceiveTransferForm,
  normalizeReceivedAmount,
  defaultReceivedAmountInput,
} from './transferReceiveValidation'

describe('transferReceiveValidation', () => {
  it('requires amount only', () => {
    const errors = validateReceiveTransferForm({ receivedAmount: '' })
    expect(errors.receivedAmount).toBeTruthy()
    expect(errors.receivedMethod).toBeUndefined()
  })

  it('accepts valid form without method', () => {
    const errors = validateReceiveTransferForm({
      receivedAmount: '125000',
    })
    expect(errors).toEqual({})
  })

  it('normalizes amount', () => {
    expect(normalizeReceivedAmount('12,5')).toBe('12.5')
  })

  it('préremplit le montant sans virgule ni séparateur', () => {
    expect(defaultReceivedAmountInput({ amountReceived: 125000.4 })).toBe('125000')
    expect(defaultReceivedAmountInput({ amountReceived: '98 500,00' })).toBe('98500')
  })
})
