import { useMemo, useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useLanguage } from '../../contexts/useLanguage'
import { selectPlatformFees } from '../admin/platformRatesSlice'
import { currencyForCountry, DIRECTIONS } from './transferConfig'
import { calculateTransfer, formatMoney, validateTransferAmount } from './transferUtils'
import { useExchangeRate } from './useExchangeRate'

export function TransferCalculator({ originCountry: originCountryProp, verified = false }) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const platformFees = useSelector(selectPlatformFees)
  const originCountry =
    originCountryProp || user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')
  const originCurrency = currencyForCountry(originCountry)
  const [direction, setDirection] = useState(DIRECTIONS.BJ_TO_RU)
  const [amount, setAmount] = useState('50000')
  const liveRate = useExchangeRate(originCurrency)
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin
  const calculation = useMemo(
    () =>
      calculateTransfer(
        amount,
        direction,
        platformFees.feePercent,
        selectedRate,
        originCountry,
        platformFees.transferFeePercent,
      ),
    [amount, direction, selectedRate, originCountry, platformFees.feePercent, platformFees.transferFeePercent],
  )
  const amountError = validateTransferAmount(amount, direction, verified, 0, originCountry, t)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black">{t('transfers.calculator.title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('transfers.calculator.description')}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          {liveRate.loading ? t('transfers.calculator.refreshing') : liveRate.source}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Select
          id="calculator-direction"
          label={t('transfers.calculator.direction')}
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
        >
          <option value={DIRECTIONS.BJ_TO_RU}>{originCurrency} → RUB</option>
          <option value={DIRECTIONS.RU_TO_BJ}>RUB → {originCurrency}</option>
        </Select>
        <Input
          id="calculator-amount"
          label={t('transfers.calculator.amountIn', { currency: calculation.currencyFrom })}
          type="number"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={amountError}
        />
      </div>
      <button
        type="button"
        className="mx-auto mt-4 grid size-11 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm"
        onClick={() =>
          setDirection((current) =>
            current === DIRECTIONS.BJ_TO_RU ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU,
          )
        }
        aria-label={t('transfers.calculator.invertAria')}
      >
        <FiRepeat />
      </button>
      {!amountError ? (
        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3 dark:bg-slate-950">
          <Metric
            label={t('transfers.calculator.totalToPay')}
            value={formatMoney(calculation.totalToPay, calculation.currencyFrom)}
            emphasize
          />
          <Metric
            label={t('transfers.calculator.appliedRate')}
            value={`1 ${calculation.currencyFrom} = ${calculation.rate.toFixed(6)} ${calculation.currencyTo}`}
          />
          <Metric
            label={t('transfers.calculator.recipientReceives')}
            value={formatMoney(calculation.amountReceived, calculation.currencyTo)}
          />
        </div>
      ) : (
        <div className="mt-5">
          <Alert variant="info">{t('transfers.calculator.fixAmount')}</Alert>
        </div>
      )}
      {!amountError ? (
        <p className="mt-3 text-xs text-slate-500">
          {t('transfers.calculator.feesDetail', {
            percent: calculation.feePercent,
            fees: formatMoney(calculation.fees, calculation.currencyFrom),
          })}
        </p>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        {t('transfers.calculator.rateNote', {
          from: calculation.currencyFrom,
          rate: calculation.rate.toFixed(6),
          to: calculation.currencyTo,
          date: liveRate.date || t('transfers.calculator.dateUnavailable'),
          margin: calculation.rateMarginPercent,
        })}
      </p>
    </Card>
  )
}

function Metric({ label, value, emphasize = false }) {
  return (
    <div>
      <span className="block text-xs text-slate-500">{label}</span>
      <strong className={`mt-1 block ${emphasize ? 'text-base text-brand-700 dark:text-brand-300' : 'text-sm'}`}>
        {value}
      </strong>
    </div>
  )
}
