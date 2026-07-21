import { useMemo, useState } from 'react'
import { FiArrowUpRight, FiRepeat } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { currencyForCountry, DIRECTIONS } from './transferConfig'
import { calculateTransfer } from './transferUtils'
import { useExchangeRate } from './useExchangeRate'

export function DashboardTransferCalculator({ onOpen }) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')

  const initialDirection = user?.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU

  const [direction, setDirection] = useState(initialDirection)
  const [amount, setAmount] = useState(user?.country === 'RU' ? '5000' : '100000')
  const liveRate = useExchangeRate(currencyForCountry(originCountry))
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin
  const calculation = useMemo(
    () => calculateTransfer(amount, direction, undefined, selectedRate, originCountry),
    [amount, direction, selectedRate, originCountry],
  )

  function invert() {
    setDirection((current) =>
      current === DIRECTIONS.BJ_TO_RU ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU,
    )
    setAmount(String(Math.max(0, Math.round(calculation.amountReceived))))
  }

  function updateReceived(value) {
    const numeric = Math.max(0, Number(value) || 0)
    const effectiveRate = calculation.rate || 1
    setAmount(String(Math.round(numeric / effectiveRate)))
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[var(--radius-card-lg)] bg-white/12 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white/65">{t('transfers.dashboardCalc.eyebrow')}</p>
          <h2 className="mt-1 truncate text-lg font-black sm:text-xl">{t('transfers.dashboardCalc.title')}</h2>
        </div>
        <button
          type="button"
          onClick={invert}
          className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-btn)] bg-white text-brand-800 sm:size-11"
          aria-label={t('transfers.calculator.invertAria')}
        >
          <FiRepeat />
        </button>
      </div>
      <div className="mt-5 grid min-w-0 gap-3 sm:mt-6">
        <CurrencyField
          label={t('transfers.dashboardCalc.youSend')}
          currency={calculation.currencyFrom}
          value={amount}
          onChange={setAmount}
        />
        <CurrencyField
          dark
          label={t('transfers.dashboardCalc.receivedEstimate')}
          currency={calculation.currencyTo}
          value={roundAmount(calculation.amountReceived)}
          onChange={updateReceived}
        />
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 text-[10px] text-white/65">
        <span className="min-w-0 truncate">
          1 {calculation.currencyFrom} = {calculation.rate.toFixed(5)} {calculation.currencyTo}
        </span>
        <span className="shrink-0">
          {liveRate.loading
            ? t('transfers.calculator.refreshing')
            : `${liveRate.source}${liveRate.date ? ` · ${liveRate.date}` : ''}`}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 flex w-full min-w-0 items-center justify-between gap-2 rounded-[var(--radius-btn)] bg-cyan-300 px-3 py-3 text-sm font-black text-slate-950 sm:px-4"
      >
        <span className="truncate">{t('transfers.dashboardCalc.openCalculator')}</span>
        <FiArrowUpRight className="shrink-0" />
      </button>
    </div>
  )
}

function CurrencyField({ currency, dark = false, label, onChange, value }) {
  return (
    <label
      className={`min-w-0 overflow-hidden rounded-[var(--radius-input)] p-3 sm:p-4 ${
        dark ? 'bg-slate-950/25' : 'bg-white text-slate-950'
      }`}
    >
      <span
        className={`block truncate text-[10px] font-black uppercase tracking-wider ${
          dark ? 'text-white/55' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
      <span className="mt-2 flex min-w-0 items-center gap-2 sm:gap-3">
        <input
          className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none sm:text-2xl"
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black sm:px-3 ${
            dark ? 'bg-white/15' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {currency}
        </span>
      </span>
    </label>
  )
}

function roundAmount(value) {
  return Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, '')
}
