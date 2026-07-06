export const DIRECTIONS = {
  BJ_TO_RU: 'BJ_TO_RU',
  RU_TO_BJ: 'RU_TO_BJ',
}

export const TRANSFER_STATUS = {
  PENDING: 'pending_payment',
  DECLARED: 'payment_declared',
  RECEIVED: 'payment_received',
  PROCESSING: 'processing',
  PAID_OUT: 'paid_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
}

export const TRANSFER_TRANSITIONS = {
  [TRANSFER_STATUS.DECLARED]: TRANSFER_STATUS.RECEIVED,
  [TRANSFER_STATUS.RECEIVED]: TRANSFER_STATUS.PAID_OUT,
  [TRANSFER_STATUS.PROCESSING]: TRANSFER_STATUS.PAID_OUT,
  [TRANSFER_STATUS.PAID_OUT]: TRANSFER_STATUS.COMPLETED,
}

export const TRANSFER_CONFIG = {
  feePercent: 2.5,
  rateMarginPercent: 1,
  paymentWindowMinutes: 30,
  minimums: { XOF: 1000, RUB: 500 },
  limits: {
    unverified: { XOF: 500000, RUB: 200000 },
    verified: { XOF: 5000000, RUB: 500000 },
  },
}

export const FALLBACK_RATES = {
  [DIRECTIONS.BJ_TO_RU]: {
    from: 'XOF',
    to: 'RUB',
    rawRate: 0.1015,
  },
  [DIRECTIONS.RU_TO_BJ]: {
    from: 'RUB',
    to: 'XOF',
    rawRate: 9.85,
  },
}

export const PAYMENT_METHODS = {
  BJ: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
  RU: ['Sberbank', 'VTB', 'T-Bank', 'Alfa-Bank', 'Gazprombank', 'Raiffeisenbank', 'Ozon Bank'],
}

export const COUNTRY_CURRENCIES = {
  BJ: 'XOF',
  BF: 'XOF',
  CI: 'XOF',
  GW: 'XOF',
  ML: 'XOF',
  NE: 'XOF',
  SN: 'XOF',
  TG: 'XOF',
  CM: 'XAF',
  CF: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  GA: 'XAF',
  GQ: 'XAF',
  RU: 'RUB',
  GH: 'GHS',
  NG: 'NGN',
  KE: 'KES',
  UG: 'UGX',
  TZ: 'TZS',
  RW: 'RWF',
  CD: 'CDF',
  BI: 'BIF',
  MW: 'MWK',
  ZM: 'ZMW',
  ZW: 'USD',
  GM: 'GMD',
  GN: 'GNF',
  LR: 'LRD',
  MG: 'MGA',
  MU: 'MUR',
  SC: 'SCR',
  SL: 'SLE',
  SO: 'SOS',
  SS: 'SSP',
  SZ: 'SZL',
  DJ: 'DJF',
  KM: 'KMF',
}

const DEFAULT_LIMITS = {
  XOF: { minimum: 1000, unverified: 500000, verified: 5000000 },
  XAF: { minimum: 1000, unverified: 500000, verified: 5000000 },
  RUB: { minimum: 500, unverified: 200000, verified: 500000 },
  GHS: { minimum: 50, unverified: 25000, verified: 120000 },
  NGN: { minimum: 5000, unverified: 2500000, verified: 12000000 },
  KES: { minimum: 700, unverified: 350000, verified: 1800000 },
  UGX: { minimum: 2500, unverified: 1500000, verified: 7500000 },
  TZS: { minimum: 3000, unverified: 1700000, verified: 8500000 },
  RWF: { minimum: 600, unverified: 300000, verified: 1500000 },
}

export const ORIGIN_PAYMENT_METHODS = {
  BJ: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
  TG: ['TMoney', 'Flooz'],
  CI: ['Orange Money', 'MTN Money', 'Moov Money', 'Wave'],
  SN: ['Orange Money', 'Free Money', 'Wave'],
  GH: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
  NG: ['Opay', 'PalmPay', 'Kuda', 'Bank Transfer'],
  CM: ['Orange Money', 'MTN MoMo'],
  GA: ['Airtel Money', 'Moov Money'],
}

export function paymentMethodsForCountry(countryCode) {
  if (countryCode === 'RU') return PAYMENT_METHODS.RU
  return ORIGIN_PAYMENT_METHODS[countryCode] || ['Mobile money local', 'Virement bancaire local']
}

export function currencyForCountry(countryCode) {
  return COUNTRY_CURRENCIES[countryCode] || 'XOF'
}

export function transferCurrenciesForCountry(countryCode) {
  return [...new Set([currencyForCountry(countryCode), 'RUB'])]
}

export function transferLimitsForCurrency(currency) {
  return DEFAULT_LIMITS[currency] || DEFAULT_LIMITS.XOF
}

export const FALLBACK_EXCHANGERS = [
  {
    id: 'EXC-MOXT',
    name: 'MOXT Change',
    rating: 4.9,
    feePercent: TRANSFER_CONFIG.feePercent,
    averageDelay: '10 à 20 min',
    methods: [...PAYMENT_METHODS.BJ, ...PAYMENT_METHODS.RU],
    paymentAccount: 'Compte communiqué après confirmation',
  },
  {
    id: 'EXC-PONT',
    name: 'Pont Bénin Russie',
    rating: 4.7,
    feePercent: 3,
    averageDelay: '20 à 35 min',
    methods: [...PAYMENT_METHODS.BJ, ...PAYMENT_METHODS.RU],
    paymentAccount: 'Coordonnées sécurisées dans le suivi',
  },
]
