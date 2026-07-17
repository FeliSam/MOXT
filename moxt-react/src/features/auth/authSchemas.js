import * as Yup from 'yup'
import {
  phonePrefixForCallingCode,
  validateInternationalPhone,
  validatePhone,
} from '../../config/phone'
import { FALLBACK_AFRICAN_COUNTRIES } from '../../config/geography'

/**
 * Builds a message resolver. When a translation function `t` is provided, it
 * resolves `t(key)` (using the French source as the i18n default value). When
 * no `t` is provided, or when the key resolves to nothing / echoes back the
 * key, it falls back to the exact original French message.
 */
const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key, { defaultValue: fallback })
  if (translated == null || translated === key) return fallback
  return translated
}

export const createAuthSchemas = (t) => {
  const m = createMessageResolver(t)

  const password = Yup.string()
    .min(8, m('validation.password.min', 'Utilisez au moins 8 caracteres.'))
    .matches(/[A-Z]/, m('validation.password.uppercase', 'Ajoutez une lettre majuscule.'))
    .matches(/[a-z]/, m('validation.password.lowercase', 'Ajoutez une lettre minuscule.'))
    .matches(/\d/, m('validation.password.digit', 'Ajoutez un chiffre.'))
    .required(m('validation.password.required', 'Le mot de passe est obligatoire.'))

  const loginSchema = Yup.object({
    identifier: Yup.string()
      .trim()
      .test(
        'email-or-russian-phone',
        m(
          'validation.identifier.invalid',
          'Saisissez un e-mail valide ou un numéro russe au format +7XXXXXXXXXX.',
        ),
        (value) =>
          Boolean(value) &&
          (Yup.string().email().isValidSync(value) || validatePhone(value, 'RU')),
      )
      .required(
        m('validation.identifier.required', "L'e-mail ou le numéro russe est obligatoire."),
      ),
    password: Yup.string().required(
      m('validation.password.required', 'Le mot de passe est obligatoire.'),
    ),
  })

  const loginEmailSchema = Yup.object({
    email: Yup.string()
      .email(m('validation.email.invalid', 'Adresse e-mail invalide.'))
      .required(m('validation.email.required', "L'e-mail est obligatoire.")),
    password: Yup.string().required(
      m('validation.password.required', 'Le mot de passe est obligatoire.'),
    ),
  })

  const loginPhonePasswordSchema = Yup.object({
    phone: Yup.string()
      .test(
        'russian-phone',
        m('validation.phone.russianFormat', 'Utilisez le format russe +7 suivi de 10 chiffres.'),
        (value) => validatePhone(value, 'RU'),
      )
      .required(m('validation.phone.russianRequired', 'Le numéro russe est obligatoire.')),
    password: Yup.string().required(
      m('validation.password.required', 'Le mot de passe est obligatoire.'),
    ),
  })

  const oauthProfileCompletionSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.firstRequired', 'Le prenom est obligatoire.')),
    lastName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.lastRequired', 'Le nom est obligatoire.')),
    email: Yup.string()
      .trim()
      .email(m('validation.email.invalid', 'Adresse e-mail invalide.'))
      .required(m('validation.email.required', "L'e-mail est obligatoire.")),
    originCountry: Yup.string().required(
      m('validation.country.originRequired', 'Le pays de provenance est obligatoire.'),
    ),
    residenceCountry: Yup.string()
      .oneOf(['RU'])
      .required(m('validation.country.residenceRussia', 'La résidence doit être en Russie.')),
    residenceCity: Yup.string()
      .trim()
      .min(2, m('validation.city.invalid', 'Ville invalide.'))
      .required(m('validation.city.required', 'La ville est obligatoire.')),
    russianPhone: Yup.string()
      .test(
        'russian-phone',
        m('validation.phone.russianFormat', 'Utilisez le format russe +7 suivi de 10 chiffres.'),
        (value) => validatePhone(value, 'RU'),
      )
      .required(m('validation.phone.russianRequired', 'Le numéro russe est obligatoire.')),
    originPhone: Yup.string().test(
      'origin-phone',
      m('validation.phone.originInvalid', 'Le numéro du pays de provenance est invalide.'),
      function (value) {
        const country = FALLBACK_AFRICAN_COUNTRIES.find(
          (item) => item.code === this.parent.originCountry,
        )
        const prefix = phonePrefixForCallingCode(country?.callingCode || '')
        if (!value || value === prefix) return true
        return validateInternationalPhone(value, prefix)
      },
    ),
    acceptTerms: Yup.boolean().oneOf(
      [true],
      m('validation.terms.required', 'Vous devez accepter les conditions.'),
    ),
  })

  const registerSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.firstRequired', 'Le prenom est obligatoire.')),
    lastName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.lastRequired', 'Le nom est obligatoire.')),
    email: Yup.string()
      .trim()
      .email(m('validation.email.invalid', 'Adresse e-mail invalide.'))
      .required(m('validation.email.required', "L'e-mail est obligatoire.")),
    originCountry: Yup.string().required(
      m('validation.country.originRequired', 'Le pays de provenance est obligatoire.'),
    ),
    residenceCountry: Yup.string()
      .oneOf(['RU'])
      .required(m('validation.country.residenceRussia', 'La résidence doit être en Russie.')),
    residenceCity: Yup.string()
      .trim()
      .min(2, m('validation.city.invalid', 'Ville invalide.'))
      .required(m('validation.city.required', 'La ville est obligatoire.')),
    russianPhone: Yup.string()
      .test(
        'russian-phone',
        m('validation.phone.russianFormat', 'Utilisez le format russe +7 suivi de 10 chiffres.'),
        (value) => validatePhone(value, 'RU'),
      )
      .required(m('validation.phone.russianRequired', 'Le numéro russe est obligatoire.')),
    originPhone: Yup.string().test(
      'origin-phone',
      m('validation.phone.originInvalid', 'Le numéro du pays de provenance est invalide.'),
      function (value) {
        const country = FALLBACK_AFRICAN_COUNTRIES.find(
          (item) => item.code === this.parent.originCountry,
        )
        const prefix = phonePrefixForCallingCode(country?.callingCode || '')
        if (!value || value === prefix) return true
        return validateInternationalPhone(value, prefix)
      },
    ),
    password,
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref('password')],
        m('validation.password.mismatch', 'Les mots de passe ne correspondent pas.'),
      )
      .required(m('validation.password.confirm', 'Confirmez le mot de passe.')),
    acceptTerms: Yup.boolean().oneOf(
      [true],
      m('validation.terms.required', 'Vous devez accepter les conditions.'),
    ),
  })

  const forgotPasswordSchema = Yup.object({
    email: Yup.string()
      .email(m('validation.email.invalid', 'Adresse e-mail invalide.'))
      .required(m('validation.email.required', "L'e-mail est obligatoire.")),
  })

  const resetPasswordSchema = Yup.object({
    password,
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref('password')],
        m('validation.password.mismatch', 'Les mots de passe ne correspondent pas.'),
      )
      .required(m('validation.password.confirmReset', 'Confirmez votre mot de passe.')),
  })

  const profileSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.firstRequired', 'Le prenom est obligatoire.')),
    lastName: Yup.string()
      .trim()
      .min(2, m('validation.name.min', 'Minimum 2 caracteres.'))
      .required(m('validation.name.lastRequired', 'Le nom est obligatoire.')),
    avatarUrl: Yup.string()
      .trim()
      .url(m('validation.avatar.invalid', "L'adresse de l'image est invalide."))
      .nullable(),
    phone: Yup.string()
      .test(
        'russian-phone',
        m('validation.phone.russianFormat', 'Utilisez le format russe +7 suivi de 10 chiffres.'),
        (value) => validatePhone(value, 'RU'),
      )
      .required(m('validation.phone.russianRequired', 'Le numéro russe est obligatoire.')),
    secondaryPhone: Yup.string().test(
      'origin-phone',
      m('validation.phone.originInvalid', 'Le numéro du pays de provenance est invalide.'),
      function (value) {
        const country = FALLBACK_AFRICAN_COUNTRIES.find(
          (item) => item.code === this.parent.originCountry,
        )
        const prefix = phonePrefixForCallingCode(country?.callingCode || '')
        if (!value || value === prefix) return true
        return validateInternationalPhone(value, prefix)
      },
    ),
    country: Yup.string()
      .oneOf(['RU'])
      .required(m('validation.country.residenceRussia', 'La résidence doit être en Russie.')),
    originCountry: Yup.string().required(
      m('validation.country.originRequired', 'Le pays de provenance est obligatoire.'),
    ),
    city: Yup.string()
      .trim()
      .min(2, m('validation.city.invalid', 'Ville invalide.'))
      .required(m('validation.city.required', 'La ville est obligatoire.')),
  })

  return {
    loginSchema,
    loginEmailSchema,
    loginPhonePasswordSchema,
    oauthProfileCompletionSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    profileSchema,
  }
}

const defaultSchemas = createAuthSchemas()

export const loginSchema = defaultSchemas.loginSchema
export const loginEmailSchema = defaultSchemas.loginEmailSchema
export const loginPhonePasswordSchema = defaultSchemas.loginPhonePasswordSchema
export const oauthProfileCompletionSchema = defaultSchemas.oauthProfileCompletionSchema
export const registerSchema = defaultSchemas.registerSchema
export const forgotPasswordSchema = defaultSchemas.forgotPasswordSchema
export const resetPasswordSchema = defaultSchemas.resetPasswordSchema
export const profileSchema = defaultSchemas.profileSchema

export const oauthProfileStepFields = {
  2: ['firstName', 'lastName', 'email', 'originCountry'],
  3: ['residenceCountry', 'residenceCity', 'russianPhone', 'originPhone', 'acceptTerms'],
}

export const registerStepFields = {
  1: ['firstName', 'lastName', 'email'],
  2: ['originCountry'],
  3: [
    'residenceCountry',
    'residenceCity',
    'russianPhone',
    'originPhone',
    'password',
    'confirmPassword',
    'acceptTerms',
  ],
}
