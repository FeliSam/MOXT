import * as Yup from 'yup'
import { publishText } from '../publications/publishI18n'

const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = publishText(t, key)
  if (translated == null || translated === key) return fallback
  return translated
}

export const createJobSchemas = (t) => {
  const m = createMessageResolver(t)

  const jobSchema = Yup.object({
    title: Yup.string()
      .trim()
      .min(4)
      .required(m('publish.job.validation.title', 'Titre obligatoire.')),
    sector: Yup.string()
      .trim()
      .required(m('publish.job.validation.sector', 'Secteur obligatoire.')),
    location: Yup.string()
      .trim()
      .required(m('publish.job.validation.location', 'Lieu obligatoire.')),
    contractType: Yup.string()
      .trim()
      .required(m('publish.job.validation.contractType', 'Type obligatoire.')),
    salary: Yup.string()
      .trim()
      .required(m('publish.job.validation.salary', 'Remuneration obligatoire.')),
    description: Yup.string()
      .trim()
      .min(30, m('publish.job.validation.descriptionChars', 'Ajoutez au moins 30 caracteres.'))
      .required(),
    requirements: Yup.string()
      .trim()
      .min(10)
      .required(m('publish.job.validation.requirements', 'Profil recherche obligatoire.')),
  })

  const applicationSchema = Yup.object({
    message: Yup.string()
      .trim()
      .min(
        20,
        m('publish.job.validation.applicationMessage', 'Ajoutez au moins 20 caracteres.'),
      )
      .required(),
  })

  return { jobSchema, applicationSchema }
}

const defaults = createJobSchemas()

/** @deprecated Prefer createJobSchemas(t).jobSchema */
export const jobSchema = defaults.jobSchema

/** @deprecated Prefer createJobSchemas(t).applicationSchema */
export const applicationSchema = defaults.applicationSchema
