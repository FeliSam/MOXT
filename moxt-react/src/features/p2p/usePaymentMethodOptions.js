import { useEffect, useState } from 'react'
import { paymentMethodsForCountry, PAYMENT_METHODS } from '../transfers/transferConfig'
import { fetchRussianBanks } from '../../services/russianBanksService'

/**
 * Options de méthode P2P / paiement :
 * - Afrique → réseaux du pays (`paymentMethodsForCountry`)
 * - Russie → liste banques NSPK (SBP)
 */
export function usePaymentMethodOptions(countryCode) {
  const isRussia = countryCode === 'RU'
  const [options, setOptions] = useState(() =>
    isRussia ? [...PAYMENT_METHODS.RU] : paymentMethodsForCountry(countryCode),
  )
  const [loading, setLoading] = useState(isRussia)

  useEffect(() => {
    if (!isRussia) {
      setOptions(paymentMethodsForCountry(countryCode))
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setOptions([...PAYMENT_METHODS.RU])
    void fetchRussianBanks().then((banks) => {
      if (cancelled) return
      setOptions(banks)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [countryCode, isRussia])

  return { options, loading, isRussia }
}

/** Pays des méthodes selon la devise proposée (RUB → banques RU, sinon pays d’origine). */
export function methodCountryForP2POffer(fromCurrency, originCountry) {
  if (fromCurrency === 'RUB') return 'RU'
  return originCountry || 'BJ'
}
