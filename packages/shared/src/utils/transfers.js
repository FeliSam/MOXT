import { formatCurrency, formatDateTime } from './formatters.js'

export const TRANSFER_DIRECTIONS = {
  BJ_TO_RU: 'bj_to_ru',
  RU_TO_BJ: 'ru_to_bj',
}

export function formatMoney(amount, currency) {
  return formatCurrency(amount, currency)
}

export function formatTransferDate(value) {
  return formatDateTime(value)
}

export function directionLabel(direction) {
  const normalized = (direction || '').toLowerCase()
  return normalized === 'bj_to_ru'
    ? 'Bénin vers Russie'
    : 'Russie vers Bénin'
}
