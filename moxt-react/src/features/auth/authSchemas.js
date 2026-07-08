import * as Yup from 'yup'
import {
  phonePrefixForCallingCode,
  validateInternationalPhone,
  validatePhone,
} from '../../config/phone'
import { FALLBACK_AFRICAN_COUNTRIES } from '../../config/geography'

const password = Yup.string()
  .min(8, 'Utilisez au moins 8 caracteres.')
  .matches(/[A-Z]/, 'Ajoutez une lettre majuscule.')
  .matches(/[a-z]/, 'Ajoutez une lettre minuscule.')
  .matches(/\d/, 'Ajoutez un chiffre.')
  .required('Le mot de passe est obligatoire.')

export const loginSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .test(
      'email-or-russian-phone',
      'Saisissez un e-mail valide ou un numéro russe au format +7XXXXXXXXXX.',
      (value) => Boolean(value) && (Yup.string().email().isValidSync(value) || validatePhone(value, 'RU')),
    )
    .required("L'e-mail ou le numéro russe est obligatoire."),
  password: Yup.string().required('Le mot de passe est obligatoire.'),
})

export const registerSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .min(2, 'Minimum 2 caracteres.')
    .required('Le prenom est obligatoire.'),
  lastName: Yup.string().trim().min(2, 'Minimum 2 caracteres.').required('Le nom est obligatoire.'),
  email: Yup.string().email('Adresse email invalide.').required("L'email est obligatoire."),
  originCountry: Yup.string().required('Le pays de provenance est obligatoire.'),
  residenceCountry: Yup.string().oneOf(['RU']).required('La résidence doit être en Russie.'),
  residenceCity: Yup.string()
    .trim()
    .min(2, 'Ville invalide.')
    .required('La ville est obligatoire.'),
  russianPhone: Yup.string()
    .test('russian-phone', 'Utilisez le format russe +7 suivi de 10 chiffres.', (value) =>
      validatePhone(value, 'RU'),
    )
    .required('Le numéro russe est obligatoire.'),
  originPhone: Yup.string().test(
    'origin-phone',
    'Le numéro du pays de provenance est invalide.',
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
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas.')
    .required('Confirmez le mot de passe.'),
  acceptTerms: Yup.boolean().oneOf([true], 'Vous devez accepter les conditions.'),
  verificationMethod: Yup.string()
    .oneOf(['phone', 'email'])
    .required('Choisissez une méthode de vérification.'),
  phoneDeliveryChannel: Yup.string().when('verificationMethod', {
    is: 'phone',
    then: (schema) => schema.oneOf(['sms', 'telegram']).default('sms'),
    otherwise: (schema) => schema.strip(),
  }),
})

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
  4: ['verificationMethod', 'phoneDeliveryChannel'],
}

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Adresse email invalide.').required("L'email est obligatoire."),
})

export const profileSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .min(2, 'Minimum 2 caracteres.')
    .required('Le prenom est obligatoire.'),
  lastName: Yup.string().trim().min(2, 'Minimum 2 caracteres.').required('Le nom est obligatoire.'),
  avatarUrl: Yup.string().trim().url("L'adresse de l'image est invalide.").nullable(),
  phone: Yup.string()
    .test('russian-phone', 'Utilisez le format russe +7 suivi de 10 chiffres.', (value) =>
      validatePhone(value, 'RU'),
    )
    .required('Le numéro russe est obligatoire.'),
  secondaryPhone: Yup.string().test(
    'origin-phone',
    'Le numéro du pays de provenance est invalide.',
    function (value) {
      const country = FALLBACK_AFRICAN_COUNTRIES.find(
        (item) => item.code === this.parent.originCountry,
      )
      const prefix = phonePrefixForCallingCode(country?.callingCode || '')
      if (!value || value === prefix) return true
      return validateInternationalPhone(value, prefix)
    },
  ),
  country: Yup.string().oneOf(['RU']).required('La résidence doit être en Russie.'),
  originCountry: Yup.string().required('Le pays de provenance est obligatoire.'),
  city: Yup.string().trim().min(2, 'Ville invalide.').required('La ville est obligatoire.'),
})
