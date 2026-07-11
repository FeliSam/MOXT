import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './authSchemas'

describe('schemas d authentification', () => {
  it('refuse un identifiant invalide a la connexion', async () => {
    await expect(
      loginSchema.validate({ identifier: 'invalide', password: '123456' }),
    ).rejects.toThrow('Saisissez un e-mail valide ou un numéro russe au format +7XXXXXXXXXX.')
  })

  it('refuse un mot de passe d inscription trop faible', async () => {
    await expect(
      registerSchema.validate({
        firstName: 'Amina',
        lastName: 'Demo',
        email: '',
        originCountry: 'BJ',
        residenceCountry: 'RU',
        residenceCity: 'Moscou',
        russianPhone: '+79000000001',
        originPhone: '+2290190000001',
        password: '12345678',
        confirmPassword: '12345678',
        acceptTerms: true,
        verificationMethod: 'phone',
      }),
    ).rejects.toThrow()
  })

  it('accepte une inscription SMS sans e-mail', async () => {
    await expect(
      registerSchema.validate({
        firstName: 'Amina',
        lastName: 'Demo',
        email: '',
        originCountry: 'BJ',
        residenceCountry: 'RU',
        residenceCity: 'Moscou',
        russianPhone: '+79000000001',
        originPhone: '+2290190000001',
        password: 'Motdepasse1',
        confirmPassword: 'Motdepasse1',
        acceptTerms: true,
        verificationMethod: 'phone',
      }),
    ).resolves.toBeTruthy()
  })
})
