import { CURRENCIES } from '../../config/options'
import {
  currencyForCountry,
  transferCurrenciesForCountry,
} from '../transfers/transferConfig'
import { formatMoney } from '../transfers/transferUtils'

export function parcelCurrencyOptions(originCountryCode) {
  return transferCurrenciesForCountry(originCountryCode)
}

export function defaultParcelCurrency(originCountryCode) {
  return currencyForCountry(originCountryCode)
}

export function resolveParcelCurrency(parcelOrCurrency) {
  if (typeof parcelOrCurrency === 'string') {
    return parcelOrCurrency.trim().toUpperCase() || 'RUB'
  }
  const nested = parcelOrCurrency?.stats?.currency
  const raw = parcelOrCurrency?.currency ?? nested ?? ''
  return String(raw).trim().toUpperCase() || 'RUB'
}

export function parcelCurrencyLabel(code) {
  const normalized = String(code || '').toUpperCase()
  const known = CURRENCIES.find((item) => item.value === normalized)
  return known?.label || normalized
}

export function formatParcelMoney(parcelOrAmount, currency) {
  if (parcelOrAmount != null && typeof parcelOrAmount === 'object') {
    const amount = parcelOrAmount.pricePerKg ?? parcelOrAmount.stats?.pricePerKg
    return formatMoney(amount, resolveParcelCurrency(parcelOrAmount))
  }
  return formatMoney(parcelOrAmount, resolveParcelCurrency(currency))
}
