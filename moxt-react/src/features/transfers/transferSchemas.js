import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'

const createMessageResolver = (t) => (key, fallback) => {
  if (typeof t !== 'function') return fallback
  const translated = t(key, { defaultValue: fallback })
  if (translated == null || translated === key) return fallback
  return translated
}

export const createTransferSchemas = (t) => {
  const m = createMessageResolver(t)

  const transferSchema = Yup.object({
    direction: Yup.string().oneOf(['BJ_TO_RU', 'RU_TO_BJ']).required(),
    sourceCountry: Yup.string().trim().required(),
    destinationCountry: Yup.string().trim().required(),
    amount: Yup.number()
      .typeError(m('validation.transfer.amountType', 'Saisissez un montant.'))
      .positive(m('validation.transfer.amountInvalid', 'Montant invalide.'))
      .required(),
    exchangerId: Yup.string().required(
      m('validation.transfer.exchangerRequired', 'Choisissez un partenaire.'),
    ),
    senderFirstName: Yup.string()
      .trim()
      .min(2, m('validation.transfer.firstNameShort', 'Prenom trop court.'))
      .required(m('validation.transfer.firstNameRequired', 'Prenom obligatoire.')),
    senderLastName: Yup.string()
      .trim()
      .min(2, m('validation.transfer.lastNameShort', 'Nom trop court.'))
      .required(m('validation.transfer.lastNameRequired', 'Nom obligatoire.')),
    senderPhone: Yup.string()
      .trim()
      .test('sender-phone-country', function (value) {
        const country =
          this.parent.sourceCountry || (this.parent.direction === 'BJ_TO_RU' ? 'BJ' : 'RU')
        return validatePhone(value, country) || this.createError({ message: phoneError(country) })
      })
      .required(m('validation.transfer.phoneRequired', 'Téléphone obligatoire.')),
    senderMethod: Yup.string().required(
      m('validation.transfer.paymentMethodRequired', 'Moyen de paiement obligatoire.'),
    ),
    recipientFirstName: Yup.string()
      .trim()
      .min(2, m('validation.transfer.firstNameShort', 'Prenom trop court.'))
      .required(m('validation.transfer.firstNameRequired', 'Prenom obligatoire.')),
    recipientLastName: Yup.string()
      .trim()
      .min(2, m('validation.transfer.lastNameShort', 'Nom trop court.'))
      .required(m('validation.transfer.lastNameRequired', 'Nom obligatoire.')),
    recipientPhone: Yup.string()
      .trim()
      .test('recipient-phone-country', function (value) {
        const country =
          this.parent.destinationCountry || (this.parent.direction === 'BJ_TO_RU' ? 'RU' : 'BJ')
        return validatePhone(value, country) || this.createError({ message: phoneError(country) })
      })
      .required(m('validation.transfer.phoneRequired', 'Téléphone obligatoire.')),
    recipientMethod: Yup.string().required(
      m('validation.transfer.receiveMethodRequired', 'Moyen de reception obligatoire.'),
    ),
    acceptTerms: Yup.boolean().oneOf(
      [true],
      m('validation.terms.required', 'Vous devez accepter les conditions.'),
    ),
  })

  return { transferSchema }
}

const defaultSchemas = createTransferSchemas()

export const transferSchema = defaultSchemas.transferSchema
