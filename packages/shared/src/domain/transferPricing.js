/** Tarification / sens d'un transfert (source unique web + mobile). */
import { currencyForCountry, DIRECTIONS, FALLBACK_RATES, TRANSFER_CONFIG } from './transferConfig.js'

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
