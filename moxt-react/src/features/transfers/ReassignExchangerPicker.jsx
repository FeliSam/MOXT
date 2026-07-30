import { useMemo, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { ExchangerPickerAvatar } from './ExchangerPickerAvatar'
import { listExchangersForTransfer } from './exchangerListUtils'
import { buildExchangerPaymentView } from './transferAccountUtils'
import { DIRECTIONS } from './transferConfig'

export function ReassignExchangerPicker({
  businesses,
  user,
  transfer,
  excludeBusinessId,
  onSelect,
}) {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = useState('')

  const exchangers = useMemo(
    () =>
      listExchangersForTransfer({
        businesses,
        user,
        originCountry: transfer.originCountry || 'BJ',
        direction: transfer.direction || DIRECTIONS.BJ_TO_RU,
        excludeOwnerId: user?.id,
      }).filter((item) => item.id !== excludeBusinessId),
    [businesses, excludeBusinessId, transfer.direction, transfer.originCountry, user],
  )

  function confirm() {
    const exchanger = exchangers.find((item) => item.id === selectedId)
    if (!exchanger) return
    const business = businesses.find((item) => item.id === exchanger.id)
    const paymentView = business
      ? buildExchangerPaymentView(business, transfer.direction, transfer.originCountry)
      : { paymentAccount: null, paymentDetails: null }
    onSelect({
      ...exchanger,
      transferAcceptanceRequired: business?.transferAcceptanceRequired === true,
      paymentAccount: paymentView.paymentAccount,
      paymentDetails: paymentView.paymentDetails,
    })
  }

  if (!exchangers.length) {
    return (
      <p className="text-sm text-[var(--app-text-muted)]">
        {t('transfers.acceptance.noOtherExchanger')}
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid max-h-64 gap-2 overflow-y-auto">
        {exchangers.map((exchanger) => {
          const active = selectedId === exchanger.id
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
              </div>
            </button>
          )
        })}
      </div>
      <Button disabled={!selectedId} icon={FiRefreshCw} onClick={confirm}>
        {t('transfers.acceptance.confirmReassign')}
      </Button>
    </div>
  )
}
