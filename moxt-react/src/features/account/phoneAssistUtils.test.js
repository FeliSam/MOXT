import { describe, expect, it } from 'vitest'
import accountReducer, {
  submitPhoneAssistRequest,
  updatePhoneAssistStatus,
} from './accountSlice.js'

function baseState() {
  return accountReducer(undefined, { type: '@@init' })
}

describe('phone assist requests', () => {
  it('crée une demande pending avec téléphone et note', () => {
    const state = accountReducer(
      baseState(),
      submitPhoneAssistRequest({
        userId: 'u1',
        phone: '+79001234567',
        note: '  pas de SMS  ',
      }),
    )
    expect(state.phoneAssistRequests).toHaveLength(1)
    expect(state.phoneAssistRequests[0]).toMatchObject({
      userId: 'u1',
      phone: '+79001234567',
      note: 'pas de SMS',
      status: 'pending',
    })
    expect(state.phoneAssistRequests[0].id).toMatch(/^PHA/)
  })

  it('n’autorise qu’une demande pending par utilisateur (écrase)', () => {
    let state = accountReducer(
      baseState(),
      submitPhoneAssistRequest({ userId: 'u1', phone: '+79001111111', note: 'a' }),
    )
    const firstId = state.phoneAssistRequests[0].id
    state = accountReducer(
      state,
      submitPhoneAssistRequest({ userId: 'u1', phone: '+79002222222', note: 'b' }),
    )
    expect(state.phoneAssistRequests).toHaveLength(1)
    expect(state.phoneAssistRequests[0].id).toBe(firstId)
    expect(state.phoneAssistRequests[0].phone).toBe('+79002222222')
    expect(state.phoneAssistRequests[0].note).toBe('b')
  })

  it('refuse un reject sans note de revue', () => {
    let state = accountReducer(
      baseState(),
      submitPhoneAssistRequest({ userId: 'u1', phone: '+79001234567' }),
    )
    const id = state.phoneAssistRequests[0].id
    state = accountReducer(
      state,
      updatePhoneAssistStatus({ id, status: 'rejected', reviewedBy: 'admin' }),
    )
    expect(state.phoneAssistRequests[0].status).toBe('pending')
  })

  it('approuve une demande', () => {
    let state = accountReducer(
      baseState(),
      submitPhoneAssistRequest({ userId: 'u1', phone: '+79001234567' }),
    )
    const id = state.phoneAssistRequests[0].id
    state = accountReducer(
      state,
      updatePhoneAssistStatus({
        id,
        status: 'approved',
        reviewedBy: 'admin',
        reviewNote: '',
      }),
    )
    expect(state.phoneAssistRequests[0].status).toBe('approved')
    expect(state.phoneAssistRequests[0].reviewedBy).toBe('admin')
    expect(state.phoneAssistRequests[0].reviewedAt).toBeTruthy()
  })
})
