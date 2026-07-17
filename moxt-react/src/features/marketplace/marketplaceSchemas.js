import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'
import {
  LISTING_TYPE_VALUES,
  isCategoryAllowed,
  validateListingBusinessRules,
} from '../../config/listingConfig'
import { MARKETPLACE_FR_SOURCES } from './marketplaceI18n'

const createMessageResolver = (t) => (key, fallback = MARKETPLACE_FR_SOURCES[key]) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key)
  if (translated == null || translated === key) return fallback
  return translated
}

export const listingSchemaFor = (country = 'RU', t) => {
  const m = createMessageResolver(t)

  return Yup.object({
    type: Yup.string().oneOf(LISTING_TYPE_VALUES).required(),
    category: Yup.string()
      .trim()
      .test(
        'category-matches-type',
        m(
          'marketplaceValidation.categoryMismatch',
          "Cette catégorie n'est pas compatible avec le type d'annonce.",
        ),
        (value, context) => isCategoryAllowed(context.parent.type, value),
      )
      .required(m('marketplaceValidation.categoryRequired', 'Catégorie obligatoire.')),
    title: Yup.string()
      .trim()
      .min(4, m('marketplaceValidation.titleShort', 'Titre trop court.'))
      .required(m('marketplaceValidation.titleRequired', 'Titre obligatoire.')),
    description: Yup.string()
      .trim()
      .min(20, m('marketplaceValidation.descriptionMin', 'Ajoutez au moins 20 caracteres.'))
      .required(),
    price: Yup.number()
      .positive(m('marketplaceValidation.pricePositive', 'Le prix doit etre superieur a 0.'))
      .required(),
    currency: Yup.string()
      .oneOf(['RUB'], m('marketplaceValidation.currencyRubOnly', 'La marketplace utilise uniquement le RUB.'))
      .required(),
    country: Yup.string().oneOf(['RU']).required(),
    city: Yup.string()
      .trim()
      .required(m('marketplaceValidation.cityRequired', 'Ville obligatoire.')),
    district: Yup.string()
      .trim()
      .required(
        m(
          'marketplaceValidation.districtArrondissementRequired',
          'Quartier ou arrondissement obligatoire.',
        ),
      ),
    address: Yup.string()
      .trim()
      .min(10, m('marketplaceValidation.addressCompleteMin', 'Ajoutez une adresse complete.'))
      .required(
        m('marketplaceValidation.addressCompleteRequired', 'Adresse complete obligatoire.'),
      ),
    contact: Yup.string()
      .trim()
      .test('listing-phone-country', (value, context) =>
        validatePhone(value, country)
          ? true
          : context.createError({ message: phoneError(country) }),
      )
      .required(m('marketplaceValidation.contactRequired', 'Contact obligatoire.')),
    whatsapp: Yup.string()
      .trim()
      .test('listing-whatsapp-country', (value, context) =>
        !value || validatePhone(value, country)
          ? true
          : context.createError({ message: phoneError(country) }),
      ),
    condition: Yup.string().nullable().oneOf(['new', 'like_new', 'used', 'refurbished', null]),
    brand: Yup.string().trim(),
    model: Yup.string().trim(),
    stock: Yup.number().integer().min(0),
    warranty: Yup.string().trim(),
    returnPolicy: Yup.string().trim(),
    weight: Yup.string().trim(),
    expiryDate: Yup.string().trim(),
    ingredients: Yup.string().trim(),
    availability: Yup.string().trim(),
    duration: Yup.string().trim(),
    remote: Yup.boolean(),
    deposit: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    minDuration: Yup.string().trim(),
    availableFrom: Yup.string().trim(),
    year: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    mileage: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    fuel: Yup.string().trim(),
    transmission: Yup.string().trim(),
    digitalFormat: Yup.string().trim(),
    fileSize: Yup.string().trim(),
    reType: Yup.string().trim(),
    surface: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    rooms: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    floor: Yup.number()
      .nullable()
      .transform((value, original) => (original === '' ? null : value)),
    furnished: Yup.string().trim(),
    reTransaction: Yup.string().trim(),
    reState: Yup.string().trim(),
  }).test('listing-business-rules', function validateBusinessRules(values) {
    const errors = validateListingBusinessRules(values, t)
    const [path, message] = Object.entries(errors)[0] ?? []
    return path ? this.createError({ path, message }) : true
  })
}
