import {
  DIRECTIONS,
  TRANSFER_CONFIG,
  TRANSFER_LIMITS_POLICY,
} from './transferConfig'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { directionInfo, getTransferPricing } from '@moxt/shared/domain/transferPricing.js'
import {
  calculateTransfer,
  calculateTransferFromReceived,
  roundMoneyUp,
} from '@moxt/shared/domain/transferCalc.js'

export { calculateTransfer, calculateTransferFromReceived, directionInfo, getTransferPricing, roundMoneyUp }


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
