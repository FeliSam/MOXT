import { useState } from 'react'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
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
import { createReview } from '../features/reviews/reviewSlice'
import { REVIEW_TARGET_TYPES } from '@moxt/shared/utils/reviewUtils.js'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { storageService } from '../services/storageService'
import { addToast } from '../features/ui/uiSlice'

const ORDER_STATUS_KEYS = {
  created: { labelKey: 'p2p.order.status.created' },
  waiting_payment: { labelKey: 'p2p.order.status.waitingPayment' },
  completed: { labelKey: 'p2p.order.status.completed' },
  cancelled: { labelKey: 'p2p.order.status.cancelled' },
  disputed: { labelKey: 'p2p.order.status.disputed' },
}

export function P2POrderPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [disputeReason, setDisputeReason] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const { orderId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const order = useSelector((state) => state.p2p.orders.find((item) => item.id === orderId))
  const myReview = useSelector((state) =>
    state.reviews.items.find(
      (item) =>
        item.authorId === user.id &&
        item.targetType === REVIEW_TARGET_TYPES.USER_PROFILE &&
        item.targetId === (order?.buyerId === user.id ? order?.sellerId : order?.buyerId),
    ),
  )
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

  const isBuyer = user.id === order.buyerId
  const isSeller = user.id === order.sellerId
  const myProofUploaded = order.proofs?.some((proof) => proof.userId === user.id)
  const isTerminal = ['completed', 'cancelled'].includes(order.status)
  const isDisputed = order.status === 'disputed'
  const otherPartyId = isBuyer ? order.sellerId : order.buyerId
  const otherPartyName = isBuyer ? order.sellerName : order.buyerName

  async function handleProofUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { path } = await storageService.uploadP2POrderProof(user.id, order.id, file)
      dispatch(
        addOrderProof({
          id: order.id,
          userId: user.id,
          name: file.name,
          size: file.size,
          type: file.type,
          path,
        }),
      )
    } catch (error) {
      dispatch(
        addToast({
          title: t('common.error'),
          message: error?.message || t('common.retryLater'),
          tone: 'error',
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleViewProof(proof) {
    if (!proof.path) return
    try {
      const signedUrl = await storageService.getTransferProofSignedUrl(proof.path)
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch {
      dispatch(
        addToast({ title: t('common.error'), message: t('common.retryLater'), tone: 'error' }),
      )
    }
  }

  function handleMarkPaid() {
    dispatch(updateOrderStatus({ id: order.id, status: 'waiting_payment' }))
  }

  function handleConfirmReceived() {
    dispatch(updateOrderStatus({ id: order.id, status: 'completed' }))
  }

  function handleCancel() {
    dispatch(updateOrderStatus({ id: order.id, status: 'cancelled' }))
  }

  function handleOpenDispute() {
    dispatch(
      openDispute({
        openedBy: user.id,
        relatedType: 'p2p_order',
        relatedId: order.id,
        reason: disputeReason,
      }),
    )
    dispatch(updateOrderStatus({ id: order.id, status: 'disputed' }))
    setDisputeReason('')
  }

  function handleSaveRating() {
    dispatch(rateOrder({ id: order.id, userId: user.id, rating, comment }))
    dispatch(
      createReview({
        targetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        targetId: otherPartyId,
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
        rating,
        comment,
      }),
    )
    dispatch(
      addToast({
        title: t('p2p.order.ratingSavedTitle'),
        message: t('p2p.order.ratingSavedBody', { name: otherPartyName }),
        tone: 'success',
      }),
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={t('p2p.order.title')}
        actions={<BackButton fallback="/p2p" />}
      />
      {isDisputed ? (
        <Card className="border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
            <p className="text-sm leading-6 text-amber-800 dark:text-amber-200">
              {t('p2p.order.disputedBanner')}
            </p>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">{t('p2p.order.summary')}</h2>
            <Badge tone={order.status === 'completed' ? 'success' : isDisputed ? 'warning' : 'info'}>
              {orderStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <Row label={t('p2p.order.amount')} value={formatMoney(order.amount, order.fromCurrency)} />
            <Row label={t('p2p.order.receivedCurrency')} value={order.toCurrency} />
            <Row label={t('p2p.order.rate')} value={order.rate} />
            <Row label={t('p2p.order.fees')} value={formatMoney(order.fee, order.fromCurrency)} />
          </div>

          {!isTerminal && !isDisputed ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {order.status === 'created' && isBuyer ? (
                <Button
                  icon={FiClock}
                  disabled={!myProofUploaded}
                  onClick={handleMarkPaid}
                >
                  {t('p2p.order.markPaid')}
                </Button>
              ) : null}
              {order.status === 'waiting_payment' && isSeller ? (
                <Button icon={FiCheckCircle} onClick={handleConfirmReceived}>
                  {t('p2p.order.confirmReceived')}
                </Button>
              ) : null}
              {order.status === 'created' ? (
                <Button icon={FiXCircle} variant="danger" onClick={handleCancel}>
                  {t('p2p.order.cancel')}
                </Button>
              ) : null}
            </div>
          ) : null}
          {order.status === 'created' && isBuyer && !myProofUploaded ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">{t('p2p.order.markPaidHint')}</p>
          ) : null}
          {order.status === 'waiting_payment' && isBuyer ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              {t('p2p.order.waitingSellerConfirmation')}
            </p>
          ) : null}
          {order.status === 'created' && isSeller ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              {t('p2p.order.waitingBuyerPayment')}
            </p>
          ) : null}

          {!isTerminal ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 text-sm font-bold">
                <FiUpload /> {uploading ? t('p2p.order.uploading') : t('p2p.order.addProof')}
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,image/*"
                  disabled={uploading}
                  onChange={handleProofUpload}
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
          ) : null}
          {order.proofs?.length ? (
            <div className="mt-5 grid gap-2">
              {order.proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FiFileText className="shrink-0" />
                    <span className="min-w-0 truncate">{proof.name}</span>
                    {proof.userId === order.buyerId ? (
                      <Badge tone="info" className="shrink-0 !text-[10px]">
                        {t('p2p.order.proofBuyer')}
                      </Badge>
                    ) : (
                      <Badge tone="slate" className="shrink-0 !text-[10px]">
                        {t('p2p.order.proofSeller')}
                      </Badge>
                    )}
                  </span>
                  {proof.path ? (
                    <button
                      type="button"
                      onClick={() => handleViewProof(proof)}
                      className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {t('p2p.order.viewProof')} <FiExternalLink className="text-xs" />
                    </button>
                  ) : null}
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
          ) : isTerminal ? null : (
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
                onClick={handleOpenDispute}
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
              <Button icon={FiStar} onClick={handleSaveRating}>
                {myReview ? t('p2p.order.updateRating') : t('p2p.order.saveRating')}
              </Button>
              <p className="text-xs text-[var(--app-text-muted)]">{t('p2p.order.ratingVisibleHint')}</p>
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
