import { transferLimitsForCurrency } from '../transfers/transferConfig'

export function calculateP2PFee(amount, currency) {
  const percentageFee = Number(amount || 0) * 0.012
  return Math.max(percentageFee, currency === 'RUB' ? 25 : 250)
}

export function p2pLimit(user, currency) {
  const limits = transferLimitsForCurrency(currency)
  return user?.verified ? limits.verified : limits.unverified
}
