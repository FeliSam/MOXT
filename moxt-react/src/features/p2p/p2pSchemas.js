import * as Yup from 'yup'

const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key, { defaultValue: fallback })
  if (translated == null || translated === key) return fallback
  return translated
}

export const createP2PSchemas = (t) => {
  const m = createMessageResolver(t)

  const p2pOfferSchema = Yup.object({
    fromCurrency: Yup.string().trim().required(),
    toCurrency: Yup.string().trim().required(),
    amount: Yup.number().positive().required(),
    rate: Yup.number().positive().required(),
    method: Yup.string()
      .trim()
      .required(m('validation.p2p.methodRequired', 'Méthode obligatoire.')),
    comment: Yup.string().trim().max(300),
  })

  return { p2pOfferSchema }
}

const defaultSchemas = createP2PSchemas()

export const p2pOfferSchema = defaultSchemas.p2pOfferSchema
