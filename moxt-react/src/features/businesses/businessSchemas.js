import * as Yup from 'yup'
import { BUSINESS_ACTIVITIES } from '../../config/businessActivities'
import { phoneError, validatePhone } from '../../config/phone'
import { BUSINESSES_FR_SOURCES } from './businessesI18n'

const activityValues = BUSINESS_ACTIVITIES.map((activity) => activity.value)

const createMessageResolver = (t) => (key, fallback = BUSINESSES_FR_SOURCES[key]) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key)
  if (translated == null || translated === key) return fallback
  return translated
}

export function businessSchemaFor(t) {
  const m = createMessageResolver(t)

  return Yup.object({
    name: Yup.string()
      .trim()
      .min(2, m('businessesValidation.nameTooShort'))
      .required(m('businessesValidation.nameRequired')),
    logoUrl: Yup.string().trim().nullable(),
    bannerUrl: Yup.string().trim().nullable(),
    primaryActivity: Yup.string()
      .oneOf(activityValues, m('businessesValidation.activityInvalid'))
      .required(m('businessesValidation.activityRequired')),
    secondaryActivity: Yup.string()
      .nullable()
      .test('secondary-different', m('businessesValidation.secondaryDifferent'), function (value) {
        return !value || value !== this.parent.primaryActivity
      }),
    sector: Yup.string().trim(),
    country: Yup.string()
      .oneOf(['RU'])
      .required(m('businessesValidation.countryRussiaOnly')),
    city: Yup.string().trim().required(m('businessesValidation.cityRequired')),
    address: Yup.string()
      .trim()
      .min(10, m('businessesValidation.addressMin'))
      .required(m('businessesValidation.addressRequired')),
    phone: Yup.string()
      .trim()
      .test('business-phone-country', function (value) {
        return validatePhone(value, 'RU') || this.createError({ message: phoneError('RU') })
      })
      .required(m('businessesValidation.phoneRequired')),
    originPhone: Yup.string().trim().max(32),
    email: Yup.string()
      .trim()
      .email(m('businessesValidation.emailInvalid'))
      .required(m('businessesValidation.emailRequired')),
    telegram: Yup.string().trim().max(80),
    description: Yup.string()
      .trim()
      .min(20, m('businessesValidation.descriptionMin'))
      .required(),
    website: Yup.string().trim().url(m('businessesValidation.websiteInvalid')),
    scheduleType: Yup.string().trim().required(m('businessesValidation.scheduleRequired')),
    schedule: Yup.array(),
    serviceZones: Yup.string().trim().max(160, m('businessesValidation.zonesTooLong')),
    services: Yup.array().min(1, m('businessesValidation.servicesMin')),
    feePercent: Yup.number().when('services', {
      is: (services) => services?.includes('Transfert'),
      then: (schema) => schema.min(0).max(20).required(m('businessesValidation.feeRequired')),
      otherwise: (schema) => schema.notRequired(),
    }),
    averageDelay: Yup.string().when('services', {
      is: (services) => services?.includes('Transfert'),
      then: (schema) => schema.trim().required(m('businessesValidation.delayRequired')),
      otherwise: (schema) => schema.notRequired(),
    }),
    currencies: Yup.array().when('services', {
      is: (services) => services?.includes('Transfert'),
      then: (schema) => schema.min(2, m('businessesValidation.currenciesMin')),
      otherwise: (schema) => schema.notRequired(),
    }),
    exchangeMethods: Yup.array().when('services', {
      is: (services) => services?.includes('Transfert'),
      then: (schema) => schema.min(1, m('businessesValidation.exchangeMethodsMin')),
      otherwise: (schema) => schema.notRequired(),
    }),
  })
}

/** @deprecated Prefer businessSchemaFor(t) for i18n. */
export const businessSchema = businessSchemaFor()
