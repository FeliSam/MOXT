import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'

export const parcelSchemaFor = (country) =>
  Yup.object({
    origin: Yup.string().trim().required('Origine obligatoire.'),
    destination: Yup.string().trim().required('Destination obligatoire.'),
    departureDate: Yup.date().min(new Date(), 'Choisissez une date future.').required(),
    depositDeadline: Yup.date()
      .min(new Date(), 'Choisissez une date future.')
      .max(Yup.ref('departureDate'), 'La date limite doit précéder le départ.')
      .required('Date limite de dépôt obligatoire.'),
    distributionDate: Yup.date()
      .nullable()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .min(Yup.ref('departureDate'), 'La distribution doit être à partir de la date de départ.'),
    capacityKg: Yup.number().positive().max(500).required(),
    pricePerKg: Yup.number().positive().required(),
    currency: Yup.string().oneOf(['RUB']).required(),
    contact: Yup.string()
      .trim()
      .test('parcel-phone-country', (value, context) =>
        validatePhone(value, country)
          ? true
          : context.createError({ message: phoneError(country) }),
      )
      .required('Contact obligatoire.'),
    conditions: Yup.string().trim().min(10, 'Precisez les conditions.').required(),
  })
