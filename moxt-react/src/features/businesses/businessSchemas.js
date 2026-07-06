import * as Yup from 'yup'
import { BUSINESS_ACTIVITIES } from '../../config/businessActivities'
import { phoneError, validatePhone } from '../../config/phone'

const activityValues = BUSINESS_ACTIVITIES.map((activity) => activity.value)

export const businessSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Nom trop court.').required('Nom obligatoire.'),
  logoUrl: Yup.string().trim().nullable(),
  bannerUrl: Yup.string().trim().nullable(),
  primaryActivity: Yup.string()
    .oneOf(activityValues, 'Selectionnez un domaine valide.')
    .required('Domaine principal obligatoire.'),
  secondaryActivity: Yup.string()
    .nullable()
    .test('secondary-different', 'Choisissez une activite differente.', function (value) {
      return !value || value !== this.parent.primaryActivity
    }),
  sector: Yup.string().trim(),
  country: Yup.string().oneOf(['RU']).required('Toutes les entreprises sont situees en Russie.'),
  city: Yup.string().trim().required('Ville obligatoire.'),
  address: Yup.string()
    .trim()
    .min(10, 'Ajoutez une adresse complete.')
    .required('Adresse complete obligatoire.'),
  phone: Yup.string()
    .trim()
    .test('business-phone-country', function (value) {
      return validatePhone(value, 'RU') || this.createError({ message: phoneError('RU') })
    })
    .required('Téléphone russe obligatoire.'),
  originPhone: Yup.string().trim().max(32),
  email: Yup.string().trim().email('Email professionnel invalide.'),
  telegram: Yup.string().trim().max(80),
  description: Yup.string().trim().min(20, 'Ajoutez au moins 20 caracteres.').required(),
  website: Yup.string().trim().url('Adresse du site invalide.'),
  scheduleType: Yup.string().trim().required('Programme horaire obligatoire.'),
  schedule: Yup.array(),
  serviceZones: Yup.string().trim().max(160, 'Liste des zones trop longue.'),
  services: Yup.array().min(1, 'Selectionnez au moins un service.'),
  feePercent: Yup.number().when('services', {
    is: (services) => services?.includes('Transfert'),
    then: (schema) => schema.min(0).max(20).required('Frais obligatoires.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  averageDelay: Yup.string().when('services', {
    is: (services) => services?.includes('Transfert'),
    then: (schema) => schema.trim().required('Delai obligatoire.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  currencies: Yup.array().when('services', {
    is: (services) => services?.includes('Transfert'),
    then: (schema) => schema.min(2, 'Selectionnez les devises echangees.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  exchangeMethods: Yup.array().when('services', {
    is: (services) => services?.includes('Transfert'),
    then: (schema) => schema.min(1, 'Selectionnez au moins un reseau ou une banque.'),
    otherwise: (schema) => schema.notRequired(),
  }),
})
