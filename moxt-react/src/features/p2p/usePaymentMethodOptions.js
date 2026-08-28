import { useEffect, useState } from 'react'
import { paymentMethodsForCountry, RU_SBP_BANKS_FALLBACK } from '../transfers/transferConfig'
import { fetchRussianBanks } from '../../services/russianBanksService'

/**
 * Options de méthode P2P / paiement :
 * - Afrique → réseaux du pays (`paymentMethodsForCountry`)
 * - Russie → liste banques NSPK (SBP)
 */
export function usePaymentMethodOptions(countryCode) {
  const isRussia = countryCode === 'RU'
  const [options, setOptions] = useState(() =>
    isRussia ? [...RU_SBP_BANKS_FALLBACK] : paymentMethodsForCountry(countryCode),
  )
  const [loading, setLoading] = useState(isRussia)

  useEffect(() => {
    if (!isRussia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le pays sélectionné (pas d'appel réseau nécessaire)
      setOptions(paymentMethodsForCountry(countryCode))
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setOptions([...RU_SBP_BANKS_FALLBACK])
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

/** Pays des méthodes de paiement selon la devise proposée (legacy / compat). */
export function methodCountryForP2POffer(fromCurrency, originCountry) {
  if (fromCurrency === 'RUB') return 'RU'
  return originCountry || 'BJ'
}

/**
 * Pays des réseaux pour la devise recherchée (toCurrency) :
 * numéro de réception + moyen de paiement côté bénéficiaire.
 */
export function receiveCountryForP2POffer(toCurrency, originCountry) {
  return methodCountryForP2POffer(toCurrency, originCountry)
}

/** Alias explicite pour le select « Réseau / moyen » à l’étape modalités. */
export function exchangeMethodCountryForP2POffer(toCurrency, originCountry) {
  return receiveCountryForP2POffer(toCurrency, originCountry)
}
