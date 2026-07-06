export const DIRECTIONS = {
  BJ_TO_RU: 'BJ_TO_RU',
  RU_TO_BJ: 'RU_TO_BJ',
} as const;

export const WIZARD_STEPS = [
  { key: 'amount', label: 'Amount', icon: '⚙️' },
  { key: 'sender', label: 'Expéditeur', icon: '👤' },
  { key: 'recipient', label: 'Destinataire', icon: '👤' },
  { key: 'confirm', label: 'Confirm', icon: '🛡️' },
];

export const PAYMENT_METHODS_RU = [
  'Sberbank', 'VTB', 'T-Bank', 'Alfa-Bank', 'Gazprombank', 'Raiffeisenbank', 'Ozon Bank',
] as const;

export const PAYMENT_METHODS_BJ = ['MTN MoMo', 'Moov Money', 'Celtiis Cash'] as const;

export function paymentMethodsForCountry(countryCode: string) {
  if (countryCode === 'RU') return [...PAYMENT_METHODS_RU];
  return [...PAYMENT_METHODS_BJ];
}

export const FALLBACK_EXCHANGERS = [
  {
    id: 'EXC-MOXT',
    name: 'MOXT Change',
    rating: 4.9,
    feePercent: 2.5,
    averageDelay: '10 à 20 min',
  },
  {
    id: 'EXC-PONT',
    name: 'Pont Bénin Russie',
    rating: 4.7,
    feePercent: 3,
    averageDelay: '20 à 35 min',
  },
];

export const TRANSFER_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'PAIEMENT ATTENDU', color: '#b45309', bg: '#fef3c7' },
  payment_declared: { label: 'PAIEMENT DÉCLARÉ', color: '#0369a1', bg: '#e0f2fe' },
  payment_received: { label: 'PAIEMENT REÇU', color: '#047857', bg: '#d1fae5' },
  processing: { label: 'EN TRAITEMENT', color: '#6d28d9', bg: '#ede9fe' },
  paid_out: { label: 'PAYÉ', color: '#047857', bg: '#d1fae5' },
  completed: { label: 'TERMINÉ', color: '#047857', bg: '#d1fae5' },
  cancelled: { label: 'ANNULÉ', color: '#b91c1c', bg: '#fef2f2' },
  expired: { label: 'EXPIRÉ', color: '#6b7280', bg: '#f3f4f6' },
};

export const PROGRESS_STEPS = [
  { key: 'pending_payment', label: 'Créé' },
  { key: 'payment_declared', label: 'Déclaré' },
  { key: 'payment_received', label: 'Reçu' },
  { key: 'paid_out', label: 'Payé' },
  { key: 'completed', label: 'Terminé' },
];

export const RATE_RUB_XOF = 7.3953;

export function directionInfo(direction: string, originCountry = 'BJ') {
  if (direction === DIRECTIONS.RU_TO_BJ) {
    const dest = originCountry !== 'RU' ? originCountry : 'BJ';
    return {
      from: 'RUB',
      to: 'XOF',
      sourceCountry: 'RU',
      destinationCountry: dest,
      label: 'Russie vers Benin',
      sub: 'Russie → Afrique',
      fromFlag: '🇷🇺',
      toFlag: '🇧🇯',
    };
  }
  const src = originCountry !== 'RU' ? originCountry : 'BJ';
  return {
    from: 'XOF',
    to: 'RUB',
    sourceCountry: src,
    destinationCountry: 'RU',
    label: 'Benin vers Russie',
    sub: 'Afrique → Russie',
    fromFlag: '🇧🇯',
    toFlag: '🇷🇺',
  };
}

export function calculateTransfer(amount: number, direction: string, feePercent = 2.5) {
  const info = directionInfo(direction);
  const numAmount = Number(amount) || 0;
  const fees = Math.round(numAmount * (feePercent / 100));
  const totalToPay = numAmount + fees;
  const rawRate = direction === DIRECTIONS.RU_TO_BJ ? RATE_RUB_XOF : 1 / RATE_RUB_XOF;
  const amountReceived = numAmount * rawRate;
  const minimum = info.from === 'RUB' ? 500 : 1000;
  return {
    ...info,
    currencyFrom: info.from,
    currencyTo: info.to,
    amountSent: numAmount,
    fees,
    totalToPay,
    amountReceived,
    rawRate,
    feePercent,
    minimum,
    minimumRequired: minimum,
    rateMarginPercent: 1,
  };
}
