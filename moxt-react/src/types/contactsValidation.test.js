import { describe, expect, it } from 'vitest'
import { validatePassport, validateIdentityFields } from './contactsValidation'
import { validateRecipientAddressForm } from './carrierAddressValidation'

describe('contactsValidation', () => {
  it('accepts valid passport', () => {
    expect(validatePassport('ab1234567')).toMatchObject({ valid: true, normalized: 'AB1234567' })
  })

  it('rejects short passport', () => {
    expect(validatePassport('AB12').valid).toBe(false)
  })

  it('requires person identity fields', () => {
    const errors = validateIdentityFields(
      { firstNames: '', lastName: '', idType: 'PASSEPORT', passportNumber: 'AB1234567', issuedBy: 'Paris', issuedAt: '2020-01-01', expiresAt: '2030-01-01' },
      'person',
    )
    expect(errors.firstNames).toBeTruthy()
    expect(errors.lastName).toBeTruthy()
  })
})

describe('carrierAddressValidation', () => {
  it('validates recipient address with identity', () => {
    const errors = validateRecipientAddressForm({
      label: 'Maison',
      country: 'BJ',
      city: 'Cotonou',
      addressLine: 'Rue 1',
      phone: '+22990000000',
      email: 'a@b.com',
      ownerType: 'PERSON',
      identity: {
        firstNames: 'Jean',
        lastName: 'Dupont',
        idType: 'PASSEPORT',
        passportNumber: 'AB1234567',
        issuedBy: 'Cotonou',
        issuedAt: '2020-01-01',
        expiresAt: '2030-01-01',
      },
    })
    expect(errors).toEqual({})
  })
})
