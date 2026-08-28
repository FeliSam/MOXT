import {
  currencyForCountry,
  DIRECTIONS,
  FALLBACK_RATES,
  transferLimitsForCurrency,
  TRANSFER_CONFIG,
  TRANSFER_LIMITS_POLICY,
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
  rateReductionPercent,
) {
  const numericAmount = Math.max(0, Number(amount) || 0)
  const info = directionInfo(direction, originCountry)
  const rawRate =
    Number.isFinite(Number(rawRateOverride)) && Number(rawRateOverride) > 0
      ? Number(rawRateOverride)
      : info.rawRate
  const margin =
    rateReductionPercent != null && Number.isFinite(Number(rateReductionPercent))
      ? Math.min(15, Math.max(0, Number(rateReductionPercent)))
      : TRANSFER_CONFIG.rateMarginPercent
  const rate = rawRate * (1 - margin / 100)
  // Montant saisi = total à payer (frais inclus). Montant envoyé = total − frais.
  const fees = numericAmount * (Number(feePercent) / 100)
  const totalToPay = numericAmount
  const amountSent = Math.max(0, numericAmount - fees)
  const limits = transferLimitsForCurrency(info.from)

  return {
    amountSent,
    amountReceived: roundMoneyUp(amountSent * rate),
    fees,
    totalToPay,
    currencyFrom: info.from,
    currencyTo: info.to,
    rawRate,
    rate,
    rateSource: rawRateOverride ? 'api' : 'fallback',
    feePercent: Number(feePercent),
    rateMarginPercent: margin,
    minimumRequired: limits.minimum,
    maximumUnverified: limits.unverified,
    maximumVerified: limits.verified,
    sourceCountry: info.sourceCountry,
    destinationCountry: info.destinationCountry,
  }
}

/**
 * Calcul ancré sur le montant exact à recevoir : le montant saisi dans la devise
 * cible est conservé tel quel ; le total à payer est dérivé en conséquence.
 */
export function calculateTransferFromReceived(
  receivedAmount,
  direction,
  feePercent = TRANSFER_CONFIG.feePercent,
  rawRateOverride,
  originCountry = 'BJ',
  rateReductionPercent,
) {
  const target = roundMoneyUp(Number(receivedAmount) || 0)
  const empty = calculateTransfer(
    0,
    direction,
    feePercent,
    rawRateOverride,
    originCountry,
    rateReductionPercent,
  )
  if (target <= 0) {
    return { ...empty, amountReceived: 0 }
  }

  const preview = calculateTransfer(
    1,
    direction,
    feePercent,
    rawRateOverride,
    originCountry,
    rateReductionPercent,
  )
  const factor = (1 - Number(preview.feePercent) / 100) * preview.rate
  if (!Number.isFinite(factor) || factor <= 0) {
    return { ...preview, amountReceived: target, totalToPay: 0, amountSent: 0, fees: 0 }
  }

  const totalToPay = roundMoneyUp(target / factor)
  const calculation = calculateTransfer(
    totalToPay,
    direction,
    feePercent,
    rawRateOverride,
    originCountry,
    rateReductionPercent,
  )

  return {
    ...calculation,
    amountReceived: target,
  }
}

/** Inverse : montant exact à recevoir → total à payer (frais inclus). */
export function totalToPayFromReceived(
  receivedAmount,
  direction,
  feePercent = TRANSFER_CONFIG.feePercent,
  rawRateOverride,
  originCountry = 'BJ',
  rateReductionPercent,
) {
  return calculateTransferFromReceived(
    receivedAmount,
    direction,
    feePercent,
    rawRateOverride,
    originCountry,
    rateReductionPercent,
  ).totalToPay
}

/** Arrondi des montants de transfert à l'entier supérieur (ex. 8810.56 → 8811). */
export function roundMoneyUp(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return Math.ceil(Number(numeric.toFixed(8)))
}

export function roundTransferInput(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return ''
  return String(roundMoneyUp(numeric))
}

/** Business % reduction for a transfer direction (0–15). Null if no business. */
export function rateReductionForDirection(businessOrExchanger, direction) {
  if (!businessOrExchanger) return null
  if (direction === DIRECTIONS.BJ_TO_RU) {
    return Number(businessOrExchanger.rateReductionToRu ?? 0)
  }
  if (direction === DIRECTIONS.RU_TO_BJ) {
    return Number(businessOrExchanger.rateReductionFromRu ?? 0)
  }
  return null
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
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return resolveMsg(t, 'validation.transfer.amountInvalid', 'Montant invalide.')
  }

  if (!TRANSFER_LIMITS_POLICY.enforceAmountLimits) {
    return null
  }

  const calculation = calculateTransfer(amount, direction, undefined, undefined, originCountry)
  const maximum = verified ? calculation.maximumVerified : calculation.maximumUnverified

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
    .reduce(
      (total, transfer) => total + Number(transfer.totalToPay || transfer.amountSent || 0),
      0,
    )
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
