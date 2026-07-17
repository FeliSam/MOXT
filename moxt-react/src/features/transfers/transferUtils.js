import {
  currencyForCountry,
  DIRECTIONS,
  FALLBACK_RATES,
  transferLimitsForCurrency,
  TRANSFER_CONFIG,
} from './transferConfig'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

export function directionInfo(direction, originCountry = 'BJ') {
  const rate = FALLBACK_RATES[direction] || FALLBACK_RATES[DIRECTIONS.BJ_TO_RU]
  const originCurrency = currencyForCountry(originCountry)
  return {
    ...rate,
    from: direction === DIRECTIONS.BJ_TO_RU ? originCurrency : 'RUB',
    to: direction === DIRECTIONS.BJ_TO_RU ? 'RUB' : originCurrency,
    sourceCountry: direction === DIRECTIONS.BJ_TO_RU ? originCountry : 'RU',
    destinationCountry: direction === DIRECTIONS.BJ_TO_RU ? 'RU' : originCountry,
  }
}

export function calculateTransfer(
  amount,
  direction,
  feePercent = TRANSFER_CONFIG.feePercent,
  rawRateOverride,
  originCountry = 'BJ',
) {
  const numericAmount = Math.max(0, Number(amount) || 0)
  const info = directionInfo(direction, originCountry)
  const rawRate =
    Number.isFinite(Number(rawRateOverride)) && Number(rawRateOverride) > 0
      ? Number(rawRateOverride)
      : info.rawRate
  const rate = rawRate * (1 - TRANSFER_CONFIG.rateMarginPercent / 100)
  const fees = numericAmount * (Number(feePercent) / 100)
  const limits = transferLimitsForCurrency(info.from)

  return {
    amountSent: numericAmount,
    amountReceived: numericAmount * rate,
    fees,
    totalToPay: numericAmount + fees,
    currencyFrom: info.from,
    currencyTo: info.to,
    rawRate,
    rate,
    rateSource: rawRateOverride ? 'api' : 'fallback',
    feePercent: Number(feePercent),
    rateMarginPercent: TRANSFER_CONFIG.rateMarginPercent,
    minimumRequired: limits.minimum,
    maximumUnverified: limits.unverified,
    maximumVerified: limits.verified,
    sourceCountry: info.sourceCountry,
    destinationCountry: info.destinationCountry,
  }
}

export function getTransferPricing(transfer) {
  const amountSent = Number(transfer?.amountSent || transfer?.amount || 0)
  const feePercent = Number(
    transfer?.feePercent ??
      transfer?.exchanger?.feePercent ??
      TRANSFER_CONFIG.feePercent ??
      0,
  )
  const fees =
    transfer?.fees != null ? Number(transfer.fees) : amountSent * (Number(feePercent) / 100)
  const totalToPay =
    transfer?.totalToPay != null ? Number(transfer.totalToPay) : amountSent + Number(fees)

  return {
    amountSent,
    feePercent,
    fees,
    totalToPay,
  }
}

function resolveMsg(t, key, fallback, vars) {
  if (typeof t === 'function') {
    const translated = t(key, vars)
    if (translated != null && translated !== key) return translated
  }
  if (!vars) return fallback
  return fallback.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function validateTransferAmount(
  amount,
  direction,
  verified = false,
  monthlyTotal = 0,
  originCountry = 'BJ',
  t,
) {
  const calculation = calculateTransfer(amount, direction, undefined, undefined, originCountry)
  const maximum = verified ? calculation.maximumVerified : calculation.maximumUnverified

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return resolveMsg(t, 'validation.transfer.amountInvalid', 'Montant invalide.')
  }
  if (Number(amount) < calculation.minimumRequired) {
    const formatted = formatMoney(calculation.minimumRequired, calculation.currencyFrom)
    return resolveMsg(t, 'validation.transfer.amountMinimum', `Le minimum est de ${formatted}.`, {
      amount: formatted,
    })
  }
  if (Number(amount) > maximum) {
    const formatted = formatMoney(maximum, calculation.currencyFrom)
    return resolveMsg(t, 'validation.transfer.amountCeiling', `Votre plafond est de ${formatted}.`, {
      amount: formatted,
    })
  }
  if (!verified && Number(amount) + Number(monthlyTotal || 0) > maximum) {
    const remaining = Math.max(0, maximum - Number(monthlyTotal || 0))
    const formatted = formatMoney(remaining, calculation.currencyFrom)
    return resolveMsg(
      t,
      'validation.transfer.amountMonthlyRemaining',
      `Votre plafond mensuel restant est de ${formatted}.`,
      { amount: formatted },
    )
  }
  return null
}

export function monthlyTransferTotal(transfers, userId, currency) {
  const now = new Date()
  return transfers
    .filter((transfer) => {
      const createdAt = new Date(transfer.createdAt)
      return (
        transfer.userId === userId &&
        transfer.currencyFrom === currency &&
        !['cancelled', 'expired'].includes(transfer.status) &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      )
    })
    .reduce((total, transfer) => total + Number(transfer.amountSent || 0), 0)
}

export function formatMoney(amount, currency) {
  return formatCurrency(amount, currency)
}

export function formatDate(value) {
  return formatDateTime(value)
}

export function directionLabel(direction, t) {
  if (direction === DIRECTIONS.BJ_TO_RU) {
    return resolveMsg(t, 'transfers.direction.bjToRu', 'Benin vers Russie')
  }
  return resolveMsg(t, 'transfers.direction.ruToBj', 'Russie vers Benin')
}
