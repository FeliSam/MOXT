import { useEffect, useState } from 'react'
import {
  getExchangeRateSnapshot,
  readCachedRate,
  subscribeExchangeRate,
} from '../../services/exchangeRateService'
import { FALLBACK_RATES } from './transferConfig'

const fallback = {
  rubToXof: FALLBACK_RATES.RU_TO_BJ.rawRate,
  xofToRub: FALLBACK_RATES.BJ_TO_RU.rawRate,
  date: null,
  source: 'Taux local de secours',
}

function initialRate() {
  return getExchangeRateSnapshot().rate || readCachedRate() || fallback
}

export function useExchangeRate() {
  const [rate, setRate] = useState(initialRate)
  const [loading, setLoading] = useState(() => getExchangeRateSnapshot().loading)

  useEffect(() => {
    return subscribeExchangeRate(({ rate: next, loading: nextLoading }) => {
      if (next) setRate(next)
      setLoading(nextLoading)
    })
  }, [])

  return { ...rate, loading }
}
