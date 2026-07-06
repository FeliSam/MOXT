import * as Yup from 'yup'
import { phoneError, validatePhone } from '../../config/phone'

export const transferSchema = Yup.object({
  direction: Yup.string().oneOf(['BJ_TO_RU', 'RU_TO_BJ']).required(),
  sourceCountry: Yup.string().trim().required(),
  destinationCountry: Yup.string().trim().required(),
  amount: Yup.number().typeError('Saisissez un montant.').positive('Montant invalide.').required(),
  exchangerId: Yup.string().required('Choisissez un partenaire.'),
  senderFirstName: Yup.string().trim().min(2, 'Prenom trop court.').required('Prenom obligatoire.'),
  senderLastName: Yup.string().trim().min(2, 'Nom trop court.').required('Nom obligatoire.'),
  senderPhone: Yup.string()
    .trim()
    .test('sender-phone-country', function (value) {
      const country = this.parent.sourceCountry || (this.parent.direction === 'BJ_TO_RU' ? 'BJ' : 'RU')
      return validatePhone(value, country) || this.createError({ message: phoneError(country) })
    })
    .required('Téléphone obligatoire.'),
  senderMethod: Yup.string().required('Moyen de paiement obligatoire.'),
  recipientFirstName: Yup.string()
    .trim()
    .min(2, 'Prenom trop court.')
    .required('Prenom obligatoire.'),
  recipientLastName: Yup.string().trim().min(2, 'Nom trop court.').required('Nom obligatoire.'),
  recipientPhone: Yup.string()
    .trim()
    .test('recipient-phone-country', function (value) {
      const country =
        this.parent.destinationCountry || (this.parent.direction === 'BJ_TO_RU' ? 'RU' : 'BJ')
      return validatePhone(value, country) || this.createError({ message: phoneError(country) })
    })
    .required('Téléphone obligatoire.'),
  recipientMethod: Yup.string().required('Moyen de reception obligatoire.'),
  acceptTerms: Yup.boolean().oneOf([true], 'Vous devez accepter les conditions.'),
})
