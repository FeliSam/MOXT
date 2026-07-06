import { describe, expect, it } from 'vitest'
import reducer, { addRecipientAddress } from './recipientAddressesSlice'

describe('recipientAddressesSlice', () => {
  it('adds recipient with identity snapshot', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    const next = reducer(
      state,
      addRecipientAddress({
        userId: 'U1',
        ownerType: 'PERSON',
        label: 'Home',
        country: 'BJ',
        city: 'Cotonou',
        addressLine: 'Rue 1',
        phone: '+229',
        email: 'a@b.com',
        identity: { firstNames: 'J', lastName: 'D', passportNumber: 'AB1234567' },
      }),
    )
    expect(next.items[0].label).toBe('Home')
    expect(next.items[0].identity.firstNames).toBe('J')
  })
})
