import { FiAlertTriangle, FiCheckCircle, FiCreditCard, FiPlus } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PublicationModal } from '../components/ui/PublicationModal'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import {
  addWalletEntry,
  createSimulatedPayment,
  updateSimulatedPaymentStatus,
} from '../features/finance/financeSlice'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { phase3Text } from '../i18n/phase3I18n'

export function PaymentsPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [simulationOpen, setSimulationOpen] = useState(false)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const transfers = useSelector((state) =>
    state.transfers.items.filter((item) => item.userId === user.id),
  )
  const payments = useSelector((state) =>
    state.finance.payments.filter((item) => item.userId === user.id),
  )

  function createForTransfer(transfer) {
    dispatch(
      createSimulatedPayment({
        userId: user.id,
        relatedType: 'transfer',
        relatedId: transfer.id,
        amount: transfer.totalToPay,
        currency: transfer.currencyFrom,
        status: 'pending',
      }),
    )
    setSimulationOpen(false)
  }

  function confirm(payment) {
    dispatch(updateSimulatedPaymentStatus({ id: payment.id, status: 'completed' }))
    dispatch(
      addWalletEntry({
        userId: user.id,
        direction: 'out',
        amount: payment.amount,
        currency: payment.currency,
        label: p3('payments.walletLabel', { id: payment.relatedId }),
        relatedType: payment.relatedType,
        relatedId: payment.relatedId,
      }),
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('payments.eyebrow')}
        title={p3('payments.title')}
        description={p3('payments.description')}
        actions={
          <Button icon={FiPlus} onClick={() => setSimulationOpen(true)}>
            {p3('payments.new')}
          </Button>
        }
      />
      <Card className="flex gap-3 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <FiAlertTriangle className="mt-1 shrink-0 text-xl text-amber-600" />
        <p className="text-sm">{p3('payments.warning')}</p>
      </Card>
      <PublicationModal
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        title={p3('payments.modal.title')}
        description={p3('payments.modal.description')}
        icon={FiCreditCard}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          {transfers.map((transfer) => (
            <Button
              key={transfer.id}
              variant="secondary"
              disabled={payments.some((item) => item.relatedId === transfer.id)}
              onClick={() => createForTransfer(transfer)}
            >
              {transfer.id}
            </Button>
          ))}
        </div>
      </PublicationModal>
      {payments.length ? (
        <div className="grid gap-3">
          {payments.map((payment) => {
            const meta = statusMeta(payment.status, t)
            return (
              <Card className="flex h-full flex-wrap items-center gap-4">
                <FiCreditCard className="text-xl text-brand-600" />
                <div className="min-w-0 flex-1">
                  <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {payment.relatedId} · {formatDate(payment.createdAt)}
                  </p>
                </div>
                <Badge tone="info">{p3('payments.badge')}</Badge>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {payment.status === 'pending' ? (
                  <Button icon={FiCheckCircle} onClick={() => confirm(payment)}>
                    {p3('payments.confirm')}
                  </Button>
                ) : null}
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState title={p3('payments.empty')} />
      )}
    </div>
  )
}
