import { describe, expect, it } from 'vitest'
import { createAuthSchemas, loginSchema, registerSchema } from './authSchemas'

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
        email: 'amina@example.com',
        originCountry: 'BJ',
        residenceCountry: 'RU',
        residenceCity: 'Moscou',
        russianPhone: '+79000000001',
        originPhone: '+2290190000001',
        password: '12345678',
        confirmPassword: '12345678',
        acceptTerms: true,
      }),
    ).rejects.toThrow()
  })

  it('refuse une inscription sans e-mail', async () => {
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
      }),
    ).rejects.toThrow("L'e-mail est obligatoire.")
  })

  it('utilise les messages traduits fournis par la langue active', async () => {
    const t = (key) =>
      key === 'validation.email.required' ? 'Укажите адрес электронной почты.' : key
    const { forgotPasswordSchema } = createAuthSchemas(t)

    await expect(forgotPasswordSchema.validate({ email: '' })).rejects.toThrow(
      'Укажите адрес электронной почты.',
    )
  })
})
