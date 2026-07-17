import { useState } from 'react'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiStar,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { openDispute } from '../features/disputes/disputeSlice'
import { createReceipt } from '../features/finance/financeSlice'
import { addOrderProof, rateOrder, updateOrderStatus } from '../features/p2p/p2pSlice'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'

const ORDER_STATUS_KEYS = {
  created: { labelKey: 'p2p.order.status.created' },
  waiting_payment: { labelKey: 'p2p.order.status.waitingPayment' },
  completed: { labelKey: 'p2p.order.status.completed' },
  cancelled: { labelKey: 'p2p.order.status.cancelled' },
}

export function P2POrderPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [disputeReason, setDisputeReason] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const { orderId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const order = useSelector((state) => state.p2p.orders.find((item) => item.id === orderId))
  const dispute = useSelector((state) =>
    state.disputes.items.find(
      (item) =>
        item.relatedType === 'p2p_order' &&
        item.relatedId === orderId &&
        !['resolved', 'closed'].includes(item.status),
    ),
  )

  const orderStatusLabel = (status) =>
    ORDER_STATUS_KEYS[status] ? t(ORDER_STATUS_KEYS[status].labelKey) : status

  if (!order || ![order.buyerId, order.sellerId].includes(user.id))
    return <Card>{t('p2p.order.notFound')}</Card>

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={order.id}
        title={t('p2p.order.title')}
        description={t('p2p.order.description', {
          seller: order.sellerName,
          buyer: order.buyerName,
        })}
        actions={<BackButton fallback="/p2p" />}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">{t('p2p.order.summary')}</h2>
            <Badge tone={order.status === 'completed' ? 'success' : 'info'}>
              {orderStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <Row label={t('p2p.order.amount')} value={formatMoney(order.amount, order.fromCurrency)} />
            <Row label={t('p2p.order.receivedCurrency')} value={order.toCurrency} />
            <Row label={t('p2p.order.rate')} value={order.rate} />
            <Row label={t('p2p.order.fees')} value={formatMoney(order.fee, order.fromCurrency)} />
          </div>
          {['created', 'waiting_payment'].includes(order.status) ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                icon={FiClock}
                variant="secondary"
                onClick={() =>
                  dispatch(updateOrderStatus({ id: order.id, status: 'waiting_payment' }))
                }
              >
                {t('p2p.order.waitingPayment')}
              </Button>
              <Button
                icon={FiCheckCircle}
                onClick={() => dispatch(updateOrderStatus({ id: order.id, status: 'completed' }))}
              >
                {t('p2p.order.complete')}
              </Button>
              <Button
                icon={FiXCircle}
                variant="danger"
                onClick={() => dispatch(updateOrderStatus({ id: order.id, status: 'cancelled' }))}
              >
                {t('p2p.order.cancel')}
              </Button>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 text-sm font-bold">
              <FiUpload /> {t('p2p.order.addProof')}
              <input
                className="sr-only"
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    dispatch(
                      addOrderProof({
                        id: order.id,
                        userId: user.id,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      }),
                    )
                  }
                }}
              />
            </label>
            <Button
              variant="secondary"
              icon={FiFileText}
              onClick={() =>
                dispatch(
                  createReceipt({
                    userId: user.id,
                    relatedType: 'p2p_order',
                    relatedId: order.id,
                    title: t('p2p.order.receiptTitle', { id: order.id }),
                    amount: order.amount,
                    currency: order.fromCurrency,
                    status: order.status,
                    details: { sellerName: order.sellerName, buyerName: order.buyerName },
                  }),
                )
              }
            >
              {t('p2p.order.saveReceipt')}
            </Button>
          </div>
          {order.proofs?.length ? (
            <div className="mt-5 grid gap-2">
              {order.proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
                >
                  <FiFileText /> {proof.name}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-black">{t('p2p.order.timeline')}</h2>
          <div className="mt-5 grid gap-4">
            {order.timeline.map((event) => (
              <div key={`${event.status}-${event.at}`} className="flex gap-3">
                <FiCheckCircle className="mt-0.5 text-brand-700" />
                <div>
                  <strong className="block text-sm">{orderStatusLabel(event.status)}</strong>
                  <span className="text-xs text-slate-500">{formatDate(event.at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">{t('p2p.order.dispute')}</h2>
          {dispute ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {t('p2p.order.disputeOpen', { status: dispute.status, reason: dispute.reason })}
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
                placeholder={t('p2p.order.disputePlaceholder')}
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
              />
              <Button
                variant="danger"
                icon={FiAlertTriangle}
                disabled={disputeReason.trim().length < 10}
                onClick={() => {
                  dispatch(
                    openDispute({
                      openedBy: user.id,
                      relatedType: 'p2p_order',
                      relatedId: order.id,
                      reason: disputeReason,
                    }),
                  )
                  setDisputeReason('')
                }}
              >
                {t('p2p.order.openDispute')}
              </Button>
            </div>
          )}
        </Card>
        {order.status === 'completed' ? (
          <Card>
            <h2 className="font-black">{t('p2p.order.rateTitle')}</h2>
            <div className="mt-4 grid gap-3">
              <select
                className="min-h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}/5
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t('p2p.order.commentPlaceholder')}
              />
              <Button
                icon={FiStar}
                onClick={() =>
                  dispatch(rateOrder({ id: order.id, userId: user.id, rating, comment }))
                }
              >
                {t('p2p.order.saveRating')}
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
