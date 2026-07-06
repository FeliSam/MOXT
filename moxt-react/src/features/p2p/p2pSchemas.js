import * as Yup from 'yup'

export const p2pOfferSchema = Yup.object({
  fromCurrency: Yup.string().trim().required(),
  toCurrency: Yup.string().trim().required(),
  amount: Yup.number().positive().required(),
  rate: Yup.number().positive().required(),
  method: Yup.string().trim().required('Méthode obligatoire.'),
  comment: Yup.string().trim().max(300),
})
