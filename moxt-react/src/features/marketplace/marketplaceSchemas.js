import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'
import {
  LISTING_TYPE_VALUES,
  isCategoryAllowed,
  validateListingBusinessRules,
} from '../../config/listingConfig'

export const listingSchemaFor = (country = 'RU') =>
  Yup.object({
    type: Yup.string().oneOf(LISTING_TYPE_VALUES).required(),
    category: Yup.string()
      .trim()
      .test(
        'category-matches-type',
        "Cette catégorie n'est pas compatible avec le type d'annonce.",
        (value, context) => isCategoryAllowed(context.parent.type, value),
      )
      .required('Catégorie obligatoire.'),
    title: Yup.string().trim().min(4, 'Titre trop court.').required('Titre obligatoire.'),
    description: Yup.string().trim().min(20, 'Ajoutez au moins 20 caracteres.').required(),
    price: Yup.number().positive('Le prix doit etre superieur a 0.').required(),
    currency: Yup.string().oneOf(['RUB'], 'La marketplace utilise uniquement le RUB.').required(),
    country: Yup.string().oneOf(['RU']).required(),
    city: Yup.string().trim().required('Ville obligatoire.'),
    district: Yup.string().trim().required('Quartier ou arrondissement obligatoire.'),
    address: Yup.string()
      .trim()
      .min(10, 'Ajoutez une adresse complete.')
      .required('Adresse complete obligatoire.'),
    contact: Yup.string()
      .trim()
      .test('listing-phone-country', (value, context) =>
        validatePhone(value, country)
          ? true
          : context.createError({ message: phoneError(country) }),
      )
      .required('Contact obligatoire.'),
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
    const errors = validateListingBusinessRules(values)
    const [path, message] = Object.entries(errors)[0] ?? []
    return path ? this.createError({ path, message }) : true
  })
