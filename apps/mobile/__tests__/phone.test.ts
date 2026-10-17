import {
  ensurePhoneCountry,
  normalizePhone,
  phoneError,
  phonePlaceholder,
  phonePrefix,
  validatePhone,
} from '../constants/phone';

describe('Phone validation & formatting helpers', () => {
  it('validates Russian phone numbers (+7 and 8 with 10 digits)', () => {
    expect(validatePhone('+79991234567', 'RU')).toBe(true);
    expect(validatePhone('89991234567', 'RU')).toBe(true);
    expect(validatePhone('+799912345', 'RU')).toBe(false);
    expect(validatePhone('+799912345678', 'RU')).toBe(false);
  });

  it('validates Beninese phone numbers (+22901 followed by 8 digits)', () => {
    expect(validatePhone('+2290197000000', 'BJ')).toBe(true);
    expect(validatePhone('+22997000000', 'BJ')).toBe(false);
    expect(validatePhone('+22901970000', 'BJ')).toBe(false);
  });

  it('returns appropriate prefixes and placeholders', () => {
    expect(phonePrefix('RU')).toBe('+7');
    expect(phonePrefix('BJ')).toBe('+22901');
    expect(phonePlaceholder('RU')).toContain('+7');
    expect(phonePlaceholder('BJ')).toContain('+22901');
  });

  it('provides country-specific error messages', () => {
    expect(phoneError('RU')).toContain('+7 ou 8');
    expect(phoneError('BJ')).toContain('+22901');
  });

  it('normalizes phone and ensures prefixes', () => {
    expect(normalizePhone(' +7 (999) 123-45-67 ')).toBe('+79991234567');
    expect(ensurePhoneCountry('9991234567', 'RU')).toBe('+79991234567');
  });
});
