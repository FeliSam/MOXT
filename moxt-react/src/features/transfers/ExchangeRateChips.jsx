import { useLanguage } from '../../contexts/useLanguage'
import { DIRECTIONS, currencyForCountry } from './transferConfig'
import { useExchangeRate } from './useExchangeRate'

function formatRate(value) {
  if (!Number.isFinite(value) || value <= 0) return null
  // Les taux vont de ~0,1 (XOF→RUB) à ~45 (RUB→UGX) : on adapte la précision
  // pour ne jamais afficher « 0,00 » ni une précision absurde.
  if (value >= 100) return value.toFixed(0)
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

/**
 * Taux du jour pour UN sens de transfert — utilisé sur la carte partenaire du
 * formulaire de transfert, où le sens est déjà choisi par l'utilisateur.
 */
export function PartnerDirectionalRate({ direction, originCountry, className = '' }) {
  const { t } = useLanguage()
  const currency = currencyForCountry(originCountry)
  const rate = useExchangeRate(currency)

  const outbound = direction === DIRECTIONS.BJ_TO_RU
  const value = outbound ? rate.originToRub : rate.rubToOrigin
  const formatted = formatRate(value)
  if (!formatted) return null

  const from = outbound ? currency : 'RUB'
  const to = outbound ? 'RUB' : currency

  return (
    <span
      className={`rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)] ${className}`}
      title={t('transfers.rate.todayTitle')}
    >
      1 {from} = {formatted} {to}
    </span>
  )
}

/**
 * Taux dans LES DEUX SENS — utilisé dans l'annuaire des échangeurs, où aucun
 * sens n'est encore choisi : l'utilisateur compare avant de se décider.
 */
export function BothWayExchangeRates({ originCountry, className = '' }) {
  const { t } = useLanguage()
  const currency = currencyForCountry(originCountry)
  const rate = useExchangeRate(currency)

  const toRub = formatRate(rate.originToRub)
  const fromRub = formatRate(rate.rubToOrigin)
  if (!toRub && !fromRub) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} title={t('transfers.rate.todayTitle')}>
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
