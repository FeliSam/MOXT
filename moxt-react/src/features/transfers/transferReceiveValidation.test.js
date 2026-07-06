import { describe, expect, it } from 'vitest'
import {
  validateReceiveTransferForm,
  normalizeReceivedAmount,
  RECEIVE_METHODS,
} from './transferReceiveValidation'

describe('transferReceiveValidation', () => {
  it('requires amount and method', () => {
    const errors = validateReceiveTransferForm({ receivedAmount: '', receivedMethod: '' })
    expect(errors.receivedAmount).toBeTruthy()
    expect(errors.receivedMethod).toBeTruthy()
  })

  it('accepts valid form', () => {
    const errors = validateReceiveTransferForm({
      receivedAmount: '125000',
      receivedMethod: RECEIVE_METHODS[0].value,
    })
    expect(errors).toEqual({})
  })

  it('normalizes amount', () => {
    expect(normalizeReceivedAmount('12,5')).toBe('12.5')
  })
})
