import { useMemo, useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { DIRECTIONS } from './transferConfig'
import { calculateTransfer, formatMoney, validateTransferAmount } from './transferUtils'
import { useExchangeRate } from './useExchangeRate'

export function TransferCalculator({ verified = false }) {
  const [direction, setDirection] = useState(DIRECTIONS.BJ_TO_RU)
  const [amount, setAmount] = useState('50000')
  const liveRate = useExchangeRate()
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.xofToRub : liveRate.rubToXof
  const calculation = useMemo(
    () => calculateTransfer(amount, direction, undefined, selectedRate),
    [amount, direction, selectedRate],
  )
  const amountError = validateTransferAmount(amount, direction, verified)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black">Calculateur</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estimation au taux de référence disponible, avant confirmation de l’entreprise.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          {liveRate.loading ? 'Actualisation…' : liveRate.source}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Select
          id="calculator-direction"
          label="Direction"
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
        >
          <option value={DIRECTIONS.BJ_TO_RU}>XOF vers RUB</option>
          <option value={DIRECTIONS.RU_TO_BJ}>RUB vers XOF</option>
        </Select>
        <Input
          id="calculator-amount"
          label={`Montant en ${calculation.currencyFrom}`}
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
        aria-label="Inverser le sens du transfert"
      >
        <FiRepeat />
      </button>
      {!amountError ? (
        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3 dark:bg-slate-950">
          <Metric
            label="Le destinataire recoit"
            value={formatMoney(calculation.amountReceived, calculation.currencyTo)}
          />
          <Metric
            label={`Frais ${calculation.feePercent}%`}
            value={formatMoney(calculation.fees, calculation.currencyFrom)}
          />
          <Metric
            label="Total a payer"
            value={formatMoney(calculation.totalToPay, calculation.currencyFrom)}
          />
        </div>
      ) : (
        <div className="mt-5">
          <Alert variant="info">Corrigez le montant pour obtenir une estimation.</Alert>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        1 {calculation.currencyFrom} = {calculation.rawRate.toFixed(6)} {calculation.currencyTo}.
        Référence du {liveRate.date || 'jour non disponible'}, avec une marge plateforme de{' '}
        {calculation.rateMarginPercent}%.
      </p>
    </Card>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <span className="block text-xs text-slate-500">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  )
}
