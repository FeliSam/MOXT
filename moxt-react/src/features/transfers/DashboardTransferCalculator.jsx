import { useMemo, useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { currencyForCountry, DIRECTIONS } from './transferConfig'
import {
  calculateTransfer,
  calculateTransferFromReceived,
  roundMoneyUp,
} from './transferUtils'
import { useExchangeRate } from './useExchangeRate'

export function DashboardTransferCalculator() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')

  const initialDirection = user?.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU

  const [direction, setDirection] = useState(initialDirection)
  const [amountAnchor, setAmountAnchor] = useState('send')
  const [amount, setAmount] = useState(user?.country === 'RU' ? '5000' : '100000')
  const [receiveInput, setReceiveInput] = useState('')
  const liveRate = useExchangeRate(currencyForCountry(originCountry))
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin
  const calculation = useMemo(() => {
    if (amountAnchor === 'receive' && receiveInput !== '') {
      return calculateTransferFromReceived(receiveInput, direction, undefined, selectedRate, originCountry)
    }
    return calculateTransfer(amount, direction, undefined, selectedRate, originCountry)
  }, [amountAnchor, receiveInput, amount, direction, selectedRate, originCountry])

  function invert() {
    const nextDirection =
      direction === DIRECTIONS.BJ_TO_RU ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU
    const nextReceive =
      amountAnchor === 'receive' && receiveInput !== ''
        ? receiveInput
        : String(roundMoneyUp(calculation.amountReceived))
    setDirection(nextDirection)
    setAmountAnchor('send')
    setReceiveInput('')
    setAmount(nextReceive)
  }

  function handleSendChange(value) {
    setAmountAnchor('send')
    setReceiveInput('')
    setAmount(value)
  }

  function handleReceiveChange(value) {
    setAmountAnchor('receive')
    setReceiveInput(value)
    if (value === '') {
      setAmount('')
      return
    }
    const total = calculateTransferFromReceived(
      value,
      direction,
      undefined,
      selectedRate,
      originCountry,
    ).totalToPay
    setAmount(total ? String(roundMoneyUp(total)) : '')
  }

  const displayedReceive =
    amountAnchor === 'receive'
      ? receiveInput
      : amount
        ? String(roundMoneyUp(calculation.amountReceived))
        : ''

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[1.05rem] font-extrabold leading-tight tracking-[-0.02em] text-[var(--app-text)] sm:text-[1.15rem]">
            {t('transfers.dashboardCalc.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={invert}
          className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-btn)] bg-[var(--app-surface)] text-[var(--app-teal)] shadow-[var(--shadow-card)] sm:size-10"
          aria-label={t('transfers.calculator.invertAria')}
        >
          <FiRepeat className="text-base" />
        </button>
      </div>
      <div className="mt-3 grid min-w-0 gap-2 sm:mt-3.5 sm:gap-2.5">
        <CurrencyField
          label={t('transfers.dashboardCalc.youSend')}
          currency={calculation.currencyFrom}
          value={amount}
          onChange={handleSendChange}
        />
        <CurrencyField
          accent
          label={t('transfers.dashboardCalc.receivedEstimate')}
          currency={calculation.currencyTo}
          value={displayedReceive}
          onChange={handleReceiveChange}
        />
      </div>
      <div className="mt-2.5 flex min-w-0 flex-wrap items-center justify-between gap-2 text-[11px] leading-snug text-[var(--app-text-muted)]">
        <span className="min-w-0 truncate font-medium">
          1 {calculation.currencyFrom} = {calculation.rate.toFixed(5)} {calculation.currencyTo}
        </span>
        <span className="shrink-0 font-medium">
          {liveRate.loading
            ? t('transfers.calculator.refreshing')
            : `${liveRate.source}${liveRate.date ? ` · ${liveRate.date}` : ''}`}
        </span>
      </div>
    </div>
  )
}

function CurrencyField({ currency, accent = false, label, onChange, value }) {
  return (
    <label
      className={`min-w-0 overflow-hidden rounded-[0.95rem] px-3 py-2.5 sm:px-3.5 sm:py-3 ${
        accent
          ? 'bg-[color-mix(in_srgb,var(--app-teal)_12%,var(--app-surface))] text-[var(--app-text)] ring-1 ring-[color-mix(in_srgb,var(--app-teal)_28%,transparent)]'
          : 'bg-[var(--app-surface)] text-[var(--app-text)] ring-1 ring-[var(--app-border)]'
      }`}
    >
      <span
        className={`block truncate text-[11px] font-bold uppercase tracking-[0.06em] ${
          accent ? 'text-[var(--app-teal)]' : 'text-[var(--app-text-muted)]'
        }`}
      >
        {label}
      </span>
      <span className="mt-1.5 flex min-w-0 items-center gap-2">
        <input
          className="min-w-0 flex-1 bg-transparent text-[1.25rem] font-extrabold leading-none tracking-tight outline-none sm:text-[1.4rem]"
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide sm:px-2.5 ${
            accent
              ? 'bg-[color-mix(in_srgb,var(--app-teal)_18%,var(--app-surface))] text-[var(--app-teal)]'
              : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
          }`}
        >
          {currency}
        </span>
      </span>
    </label>
  )
}
