import * as Yup from 'yup'

export const eventSchema = Yup.object({
  title: Yup.string().trim().min(4).required('Titre obligatoire.'),
  category: Yup.string().trim().required('Catégorie obligatoire.'),
  city: Yup.string().trim().required('Ville obligatoire.'),
  venue: Yup.string().trim().required('Lieu obligatoire.'),
  startAt: Yup.date().min(new Date(), 'Choisissez une date future.').required(),
  capacity: Yup.number().integer().positive().max(100000).required(),
  price: Yup.number().min(0).required(),
  currency: Yup.string().oneOf(['RUB']).required(),
  description: Yup.string().trim().min(20).required('Description obligatoire.'),
})
