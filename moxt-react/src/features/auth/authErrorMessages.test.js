import { describe, expect, it, vi } from 'vitest'
import { authErrorToast, sanitizeAuthMessage } from './authErrorMessages'

describe('authErrorMessages i18n', () => {
  it('traduit les codes auth connus quand t est fourni', () => {
    const t = vi.fn((key) => ({
      'errors.auth.alreadyRegistered': 'Учетная запись уже существует.',
    })[key] || key)

    expect(sanitizeAuthMessage('ALREADY_REGISTERED', t)).toBe(
      'Учетная запись уже существует.',
    )
  })

  it('traduit le cooldown OTP en conservant la durée calculée', () => {
    const t = vi.fn((key, vars) =>
      key === 'errors.auth.otpCooldown'
        ? `Повторите попытку через ${vars.seconds} секунд.`
        : key,
    )

    expect(
      sanitizeAuthMessage('Patientez 74 secondes avant de renvoyer un code.', t),
    ).toBe('Повторите попытку через 74 секунд.')
  })

  it('traduit le plafond OTP avec le maximum et le délai restant', () => {
    const t = vi.fn((key, vars) =>
      key === 'errors.auth.otpCap'
        ? `Максимум ${vars.max}; повторите через ${vars.minutes} мин.`
        : key,
    )

    expect(
      sanitizeAuthMessage(
        'Limite atteinte : maximum 4 codes par période de 3 heures. Réessayez dans environ 171 minutes.',
        t,
      ),
    ).toBe('Максимум 4; повторите через 171 мин.')
  })

  it('conserve le français de secours sans traducteur', () => {
    expect(sanitizeAuthMessage('ALREADY_REGISTERED')).toMatch(
      /Un compte existe déjà/,
    )
    expect(authErrorToast('Erreur', 'ALREADY_REGISTERED')).toMatchObject({
      title: 'Erreur',
      tone: 'error',
    })
  })
})
