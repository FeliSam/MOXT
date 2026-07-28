import { useLanguage } from '../../contexts/useLanguage'
import { DIRECTIONS, currencyForCountry } from './transferConfig'
import { useExchangeRate } from './useExchangeRate'

function formatRate(value) {
  if (!Number.isFinite(value) || value <= 0) return null
  if (value >= 100) return value.toFixed(0)
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

/** Applique la réduction configurée par l’entreprise dans son dashboard. */
function applyBusinessReduction(rawRate, reductionPercent) {
  const raw = Number(rawRate)
  if (!Number.isFinite(raw) || raw <= 0) return null
  const reduction = Math.min(15, Math.max(0, Number(reductionPercent) || 0))
  return raw * (1 - reduction / 100)
}

/**
 * Taux du partenaire pour UN sens — utilise le taux entreprise (réduction dashboard),
 * pas le taux Google/Frankfurter brut.
 */
export function PartnerDirectionalRate({ direction, originCountry, exchanger, className = '' }) {
  const { t } = useLanguage()
  const currency = currencyForCountry(originCountry)
  const rate = useExchangeRate(currency)

  const outbound = direction === DIRECTIONS.BJ_TO_RU
  const raw = outbound ? rate.originToRub : rate.rubToOrigin
  const reduction = outbound
    ? exchanger?.rateReductionToRu
    : exchanger?.rateReductionFromRu
  const value = applyBusinessReduction(raw, reduction)
  const formatted = formatRate(value)
  if (!formatted) return null

  const from = outbound ? currency : 'RUB'
  const to = outbound ? 'RUB' : currency

  return (
    <span
      className={`rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)] ${className}`}
      title={t('transfers.rate.partnerTitle')}
    >
      1 {from} = {formatted} {to}
    </span>
  )
}

/**
 * Taux dans LES DEUX SENS pour une entreprise — réductions dashboard appliquées.
 */
export function BothWayExchangeRates({ originCountry, exchanger, className = '' }) {
  const { t } = useLanguage()
  const currency = currencyForCountry(originCountry)
  const rate = useExchangeRate(currency)

  const toRub = formatRate(
    applyBusinessReduction(rate.originToRub, exchanger?.rateReductionToRu),
  )
  const fromRub = formatRate(
    applyBusinessReduction(rate.rubToOrigin, exchanger?.rateReductionFromRu),
  )
  if (!toRub && !fromRub) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} title={t('transfers.rate.partnerTitle')}>
      {toRub ? (
        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
          1 {currency} = {toRub} RUB
        </span>
      ) : null}
      {fromRub ? (
        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
          1 RUB = {fromRub} {currency}
        </span>
      ) : null}
    </div>
  )
}
