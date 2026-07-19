import { useEffect, useState } from 'react'
import {
  getExchangeRateSnapshot,
  readCachedRate,
  subscribeExchangeRate,
} from '../../services/exchangeRateService'
import { FALLBACK_RATES } from './transferConfig'

const XOF_FALLBACK = {
  rubToOrigin: FALLBACK_RATES.RU_TO_BJ.rawRate,
  originToRub: FALLBACK_RATES.BJ_TO_RU.rawRate,
}

function fallbackFor(currency) {
  if (currency === 'XOF') {
    return { ...XOF_FALLBACK, date: null, source: 'Taux local de secours' }
  }
  return { rubToOrigin: null, originToRub: null, date: null, source: null }
}

function toShape(pairResult, currency) {
  if (!pairResult) return fallbackFor(currency)
  return {
    rubToOrigin: pairResult.baseToQuote,
    originToRub: pairResult.quoteToBase,
    date: pairResult.date,
    source: pairResult.source,
  }
}

function initialRate(currency) {
  const snapshot = getExchangeRateSnapshot('RUB', currency).rate
  if (snapshot) return toShape(snapshot, currency)
  const cached = readCachedRate('RUB', currency)
  if (cached) return toShape(cached, currency)
  return fallbackFor(currency)
}

/** Live RUB <-> origin-currency rate. `currency` defaults to XOF for legacy callers. */
export function useExchangeRate(currency = 'XOF') {
  const [rate, setRate] = useState(() => initialRate(currency))
  const [loading, setLoading] = useState(() => getExchangeRateSnapshot('RUB', currency).loading)

  useEffect(() => {
    setRate(initialRate(currency))
    setLoading(true)
    return subscribeExchangeRate('RUB', currency, ({ rate: next, loading: nextLoading }) => {
      if (next) setRate(toShape(next, currency))
      setLoading(nextLoading)
    })
  }, [currency])

  return { ...rate, loading }
}
