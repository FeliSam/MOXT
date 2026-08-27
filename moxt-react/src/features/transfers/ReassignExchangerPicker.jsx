import { useMemo, useState } from 'react'
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { ExchangerPickerAvatar } from './ExchangerPickerAvatar'
import { listExchangersForTransfer } from './exchangerListUtils'
import { buildExchangerPaymentView } from './transferAccountUtils'
import { currencyForCountry, DIRECTIONS } from './transferConfig'
import {
  calculateTransfer,
  formatMoney,
  getTransferPricing,
  rateReductionForDirection,
} from './transferUtils'
import { useExchangeRate } from './useExchangeRate'

export function ReassignExchangerPicker({
  businesses,
  user,
  transfer,
  excludeBusinessId,
  onSelect,
}) {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = useState('')
  const [step, setStep] = useState('pick')
  const originCountry = transfer.originCountry || 'BJ'
  const liveRate = useExchangeRate(currencyForCountry(originCountry))
  const direction = transfer.direction || DIRECTIONS.BJ_TO_RU
  const rawRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin

  const exchangers = useMemo(
    () =>
      listExchangersForTransfer({
        businesses,
        user,
        originCountry,
        direction,
        excludeOwnerId: user?.id,
      }).filter((item) => item.id !== excludeBusinessId),
    [businesses, direction, excludeBusinessId, originCountry, user],
  )

  const selectedExchanger = exchangers.find((item) => item.id === selectedId)
  const pricingBase = getTransferPricing(transfer)
  const previewAmount = Number(pricingBase.totalToPay || transfer.totalToPay || transfer.amountSent || 0)
  const quotesById = useMemo(() => {
    const next = {}
    for (const exchanger of exchangers) {
      next[exchanger.id] = calculateTransfer(
        previewAmount,
        direction,
        exchanger.feePercent,
        rawRate,
        originCountry,
        rateReductionForDirection(exchanger, direction),
      )
    }
    return next
  }, [direction, exchangers, originCountry, previewAmount, rawRate])
  const preview = selectedId ? quotesById[selectedId] : null

  function goToPricing() {
    if (!selectedExchanger) return
    setStep('pricing')
  }

  function confirm() {
    if (!selectedExchanger || !preview) return
    const business = businesses.find((item) => item.id === selectedExchanger.id)
    const paymentView = business
      ? buildExchangerPaymentView(business, direction, originCountry)
      : { paymentAccount: null, paymentDetails: null }
    onSelect({
      exchanger: {
        ...selectedExchanger,
        transferAcceptanceRequired: business?.transferAcceptanceRequired === true,
        paymentAccount: paymentView.paymentAccount,
        paymentDetails: paymentView.paymentDetails,
      },
      amount: preview.totalToPay,
      rateOverride: rawRate,
      rateSource: liveRate.source,
      rateDate: liveRate.date,
    })
  }

  if (!exchangers.length) {
    return (
      <p className="text-sm text-[var(--app-text-muted)]">
        {t('transfers.acceptance.noOtherExchanger')}
      </p>
    )
  }

  if (step === 'pricing' && selectedExchanger && preview) {
    return (
      <div className="grid gap-4">
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
          <ExchangerPickerAvatar exchanger={selectedExchanger} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{selectedExchanger.name}</p>
            <p className="truncate text-xs text-[var(--app-text-muted)]">
              {selectedExchanger.feePercent}% · 1 {preview.currencyFrom} = {preview.rate.toFixed(6)}{' '}
              {preview.currencyTo}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--app-text-muted)]">
          {t('transfers.acceptance.reviewPricingDescription')}
        </p>
        <div className="overflow-hidden rounded-2xl border border-[var(--app-border)]">
          <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 p-4 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                {t('transfers.new.youPay')}
              </p>
              <p className="text-lg font-black">
                {formatMoney(preview.totalToPay, preview.currencyFrom)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                {t('transfers.new.recipientReceivesApprox')}
              </p>
              <p className="text-lg font-black">
                {formatMoney(preview.amountReceived, preview.currencyTo)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[var(--app-border)]">
            <div className="px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-[var(--app-text-faint)]">
                {t('transfers.new.feesPercent', { percent: preview.feePercent })}
              </p>
              <p className="text-sm font-black text-red-500">
                {formatMoney(preview.fees, preview.currencyFrom)}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-[var(--app-text-faint)]">
                {t('transfers.new.amountSent')}
              </p>
              <p className="text-sm font-black">
                {formatMoney(preview.amountSent, preview.currencyFrom)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" icon={FiArrowLeft} onClick={() => setStep('pick')}>
            {t('transfers.acceptance.backToExchangers')}
          </Button>
          <Button icon={FiRefreshCw} onClick={confirm}>
            {t('transfers.acceptance.confirmReassignPricing')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid max-h-80 gap-2 overflow-y-auto">
        {exchangers.map((exchanger) => {
          const active = selectedId === exchanger.id
          const quote = quotesById[exchanger.id]
          const sendLabel = quote
            ? formatMoney(quote.amountSent, quote.currencyFrom)
            : null
          const receiveLabel = quote
            ? formatMoney(quote.amountReceived, quote.currencyTo)
            : null
          return (
            <button
              key={exchanger.id}
              type="button"
              onClick={() => setSelectedId(exchanger.id)}
              className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-brand-400 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30'
                  : 'border-[var(--app-border)] bg-[var(--app-surface)]'
              }`}
            >
              <ExchangerPickerAvatar exchanger={exchanger} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{exchanger.name}</p>
                <p className="truncate text-xs text-[var(--app-text-muted)]">
                  {exchanger.averageDelay} · {exchanger.feePercent}%
                  {exchanger.transferAcceptanceRequired
                    ? ` · ${t('transfers.acceptance.requiresAcceptanceShort')}`
                    : ''}
                </p>
                {sendLabel && receiveLabel ? (
                  <p className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[11px] font-black tabular-nums leading-tight">
                    <span className="min-w-0 truncate text-[var(--app-text)]">
                      <span className="mr-1 font-bold text-[var(--app-text-faint)]">
                        {t('transfers.acceptance.quoteSend')}
                      </span>
                      {sendLabel}
                    </span>
                    <span className="min-w-0 truncate text-brand-700 dark:text-brand-400">
                      <span className="mr-1 font-bold text-[var(--app-text-faint)]">
                        {t('transfers.acceptance.quoteReceive')}
                      </span>
                      {receiveLabel}
                    </span>
                  </p>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
      <Button disabled={!selectedId} icon={FiRefreshCw} onClick={goToPricing}>
        {t('transfers.acceptance.reviewPricingCta')}
      </Button>
    </div>
  )
}
