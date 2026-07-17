import * as Yup from 'yup'
import { publishText } from '../publications/publishI18n'

const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = publishText(t, key)
  if (translated == null || translated === key) return fallback
  return translated
}

export const createEventSchema = (t) => {
  const m = createMessageResolver(t)

  return Yup.object({
    title: Yup.string()
      .trim()
      .min(4)
      .required(m('publish.event.validation.title', 'Titre obligatoire.')),
    category: Yup.string()
      .trim()
      .required(m('publish.event.validation.category', 'Catégorie obligatoire.')),
    city: Yup.string()
      .trim()
      .required(m('publish.event.validation.city', 'Ville obligatoire.')),
    venue: Yup.string()
      .trim()
      .required(m('publish.event.validation.venue', 'Lieu obligatoire.')),
    startAt: Yup.date()
      .min(new Date(), m('publish.event.validation.futureDate', 'Choisissez une date future.'))
      .required(),
    capacity: Yup.number().integer().positive().max(100000).required(),
    price: Yup.number().min(0).required(),
    currency: Yup.string().oneOf(['RUB']).required(),
    description: Yup.string()
      .trim()
      .min(20)
      .required(m('publish.event.validation.description', 'Description obligatoire.')),
  })
}

/** @deprecated Prefer createEventSchema(t) */
export const eventSchema = createEventSchema()
