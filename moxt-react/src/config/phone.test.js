import { describe, expect, it } from 'vitest'
import {
  constrainRussianPhone,
  ensurePhoneCountry,
  normalizePhone,
  phonePrefix,
  validatePhone,
} from './phone'

describe('phone', () => {
  it('normalise et valide les numeros beninois', () => {
    expect(normalizePhone('+229 01 90 00 00 01')).toBe('+2290190000001')
    expect(validatePhone('+229 01 90 00 00 01', 'BJ')).toBe(true)
    expect(validatePhone('+7 900 000 00 01', 'BJ')).toBe(false)
  })

  it('valide les numeros russes et prepare le bon indicatif', () => {
    expect(validatePhone('+7 900 000 00 01', 'RU')).toBe(true)
    expect(validatePhone('8 900 000 00 01', 'RU')).toBe(true)
    expect(ensurePhoneCountry('', 'RU')).toBe('+7')
    expect(ensurePhoneCountry('9000000001', 'RU')).toBe('+79000000001')
    expect(ensurePhoneCountry('8 900 000 00 01', 'RU')).toBe('89000000001')
    expect(ensurePhoneCountry('', 'BJ')).toBe('+22901')
  })

  it('contraint proprement la saisie russe en +7 ou 8', () => {
    expect(constrainRussianPhone('+7 900 000 00 01')).toBe('+79000000001')
    expect(constrainRussianPhone('8 900 000 00 01')).toBe('89000000001')
    expect(constrainRussianPhone('9000000001')).toBe('+79000000001')
  })

  it('gere les autres pays d origine avec leur indicatif', () => {
    expect(phonePrefix('TG')).toBe('+228')
    expect(ensurePhoneCountry('', 'TG')).toBe('+228')
    expect(validatePhone('+22890123456', 'TG')).toBe(true)
  })
})
