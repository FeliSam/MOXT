import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  getExchangeRateSnapshot,
  readCachedRate,
  subscribeExchangeRate,
} from '../../services/exchangeRateService'
import {
  selectPlatformPair,
} from '../admin/platformRatesSlice'
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

function applyPlatformOverlay(market, platformPair, kind) {
  if (!platformPair) return { ...market, kind, marketSource: market.source }
  const hasAdminOrigin = Number(platformPair.originToRub) > 0
  const hasAdminRub = Number(platformPair.rubToOrigin) > 0
  return {
    ...market,
    originToRub: hasAdminOrigin ? platformPair.originToRub : market.originToRub,
    rubToOrigin: hasAdminRub ? platformPair.rubToOrigin : market.rubToOrigin,
    kind,
    marketSource: market.source,
    source: hasAdminOrigin || hasAdminRub ? 'Admin' : market.source,
  }
}

/**
 * Live RUB <-> origin-currency rate.
 * @param {string} currency
 * @param {{ kind?: 'transfer'|'p2p'|'market' }} [options]
 *   - transfer/p2p: overlay admin platform rates when set
 *   - market: Frankfurter only
 */
export function useExchangeRate(currency = 'XOF', options = {}) {
  const kind = options.kind || 'transfer'
  const platformPair = useSelector((state) =>
    kind === 'market' ? null : selectPlatformPair(state, currency, kind === 'p2p' ? 'p2p' : 'transfer'),
  )
  const [marketRate, setMarketRate] = useState(() => initialRate(currency))
  const [loading, setLoading] = useState(() => getExchangeRateSnapshot('RUB', currency).loading)

  useEffect(() => {
    setMarketRate(initialRate(currency))
    setLoading(true)
    return subscribeExchangeRate('RUB', currency, ({ rate: next, loading: nextLoading }) => {
      if (next) setMarketRate(toShape(next, currency))
      setLoading(nextLoading)
    })
  }, [currency])

  const rate =
    kind === 'market' ? { ...marketRate, kind, marketSource: marketRate.source } : applyPlatformOverlay(marketRate, platformPair, kind)

  return { ...rate, loading }
}
