import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'
import { publishText } from '../publications/publishI18n'

const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = publishText(t, key)
  if (translated == null || translated === key) return fallback
  return translated
}

export const createParcelSchemaFor = (country, t) => {
  const m = createMessageResolver(t)

  return Yup.object({
    origin: Yup.string()
      .trim()
      .required(m('publish.parcel.validation.origin', 'Origine obligatoire.')),
    destination: Yup.string()
      .trim()
      .required(m('publish.parcel.validation.destination', 'Destination obligatoire.')),
    departureDate: Yup.date()
      .min(new Date(), m('publish.parcel.validation.futureDate', 'Choisissez une date future.'))
      .required(),
    depositDeadline: Yup.date()
      .min(new Date(), m('publish.parcel.validation.futureDate', 'Choisissez une date future.'))
      .max(
        Yup.ref('departureDate'),
        m(
          'publish.parcel.validation.depositBeforeDeparture',
          'La date limite doit précéder le départ.',
        ),
      )
      .required(
        m(
          'publish.parcel.validation.depositRequired',
          'Date limite de dépôt obligatoire.',
        ),
      ),
    distributionDate: Yup.date()
      .nullable()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .min(
        Yup.ref('departureDate'),
        m(
          'publish.parcel.validation.distributionFromDeparture',
          'La distribution doit être à partir de la date de départ.',
        ),
      ),
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
      .required(
        m('publish.parcel.validation.contactRequired', 'Contact obligatoire.'),
      ),
    conditions: Yup.string()
      .trim()
      .min(10, m('publish.parcel.validation.conditionsMin', 'Precisez les conditions.'))
      .required(),
  })
}

/** @deprecated Prefer createParcelSchemaFor(country, t) */
export const parcelSchemaFor = (country) => createParcelSchemaFor(country)
