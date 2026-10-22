import { TRANSFER_CONFIG, transferLimitsForCurrency } from './transferConfig.js'
import { directionInfo } from './transferPricing.js'

/** Copie de moxt-react/src/features/transfers/transferUtils.js (calculette de transfert). */
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

/** Arrondi des montants de transfert à l'entier supérieur (ex. 8810.56 → 8811). */
export function roundMoneyUp(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return Math.ceil(Number(numeric.toFixed(8)))
}

