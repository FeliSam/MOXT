/**
 * Canaux de contribution volontaire (maintien & développement MOXT).
 * Page réservée aux admin / superadmin pour l’instant.
 */
export const CONTRIBUTE_CHANNELS = [
  {
    id: 'ru-banks',
    method: 'phone',
    regionKey: 'contribute.channels.ru.region',
    titleKey: 'contribute.channels.ru.title',
    hintKey: 'contribute.channels.ru.hint',
    holderName: 'FANOU S. Feliciano',
    displayNumber: '+7 980 069 29 24',
    copyValue: '+79800692924',
    banks: ['Sberbank', 'VTB', 'Tinkoff'],
    currencies: ['RUB'],
    accent: 'teal',
  },
  {
    id: 'bj-mtn',
    method: 'mobile_money',
    regionKey: 'contribute.channels.bj.region',
    titleKey: 'contribute.channels.bj.title',
    hintKey: 'contribute.channels.bj.hint',
    holderName: 'FANOU S. Feliciano',
    displayNumber: '+229 01 57 63 63 11',
    copyValue: '+2290157636311',
    banks: ['MTN'],
    currencies: ['XOF'],
    accent: 'amber',
  },
]

export const CONTRIBUTE_CURRENCIES = ['RUB', 'XOF']
