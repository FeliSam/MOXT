import { useEffect, useState } from 'react'
import { getRubXofRate, readCachedRate } from '../../services/exchangeRateService'
import { FALLBACK_RATES } from './transferConfig'

const fallback = {
  rubToXof: FALLBACK_RATES.RU_TO_BJ.rawRate,
  xofToRub: FALLBACK_RATES.BJ_TO_RU.rawRate,
  date: null,
  source: 'Taux local de secours',
}

export function useExchangeRate() {
  const [rate, setRate] = useState(() => readCachedRate() || fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    function refresh() {
      getRubXofRate()
        .then((result) => {
          if (active) setRate(result)
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    refresh()
    const interval = window.setInterval(refresh, 15 * 60 * 1000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return { ...rate, loading }
}
