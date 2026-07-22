import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { FileNameText } from '../components/ui/FileNameText'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { UploadProgress } from '../components/ui/UploadProgress'
import { useLanguage } from '../contexts/useLanguage'
import { ContactButton } from '../features/communications/ContactButton'
import { openDispute } from '../features/disputes/disputeSlice'
import { createReceipt } from '../features/finance/financeSlice'
import { P2PCountdown } from '../features/p2p/components/P2PCountdown'
import { P2PNoEscrowBanner } from '../features/p2p/components/P2PNoEscrowBanner'
import { P2POrderStatusBar } from '../features/p2p/components/P2POrderStatusBar'
import { P2PReputationBadge } from '../features/p2p/components/P2PReputationBadge'
import {
  addOrderProof,
  expireOrder,
  rateOrder,
  updateOrderStatus,
} from '../features/p2p/p2pSlice'
import { isPastDue } from '../features/p2p/p2pUtils'
import { createReview } from '../features/reviews/reviewSlice'
import { REVIEW_TARGET_TYPES } from '@moxt/shared/utils/reviewUtils.js'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { storageService } from '../services/storageService'

const ORDER_STATUS_KEYS = {
  created: { labelKey: 'p2p.order.status.created', tone: 'info' },
  waiting_payment: { labelKey: 'p2p.order.status.waitingPayment', tone: 'warning' },
  completed: { labelKey: 'p2p.order.status.completed', tone: 'success' },
  cancelled: { labelKey: 'p2p.order.status.cancelled', tone: 'slate' },
  disputed: { labelKey: 'p2p.order.status.disputed', tone: 'warning' },
}

export function P2POrderPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [disputeReason, setDisputeReason] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const { progress: proofProgress, track: trackProofUpload } = useUploadProgress()
  const { orderId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const order = useSelector((state) => state.p2p.orders.find((item) => item.id === orderId))
  const linkedOffer = useSelector((state) =>
    state.p2p.offers.find((item) => item.id === order?.offerId),
  )
  const orders = useSelector((state) => state.p2p.orders)
  const reviews = useSelector((state) => state.reviews.items)
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

  const isStaff = ['admin', 'superadmin', 'moderator'].includes(user?.role)
  const isParty = order && [order.buyerId, order.sellerId].includes(user.id)
  const isBuyer = Boolean(order && user.id === order.buyerId)
  const isSeller = Boolean(order && user.id === order.sellerId)
  const receivePhone = order?.receivePhone || linkedOffer?.receivePhone || ''
  const receiveName =
    order?.receiveName ||
    linkedOffer?.receiveName ||
    order?.receiveAccount ||
    linkedOffer?.receiveAccount ||
    ''
  const receiveMethod = order?.method || linkedOffer?.method || ''

  const handleExpire = useCallback(() => {
    if (!order || order.status !== 'created') return
    if (!isPastDue(order.paymentDueAt)) return
    dispatch(expireOrder({ id: order.id }))
    dispatch(
      addToast({
        title: t('p2p.order.expiredTitle'),
        message: t('p2p.order.expiredBody'),
        tone: 'warning',
      }),
    )
  }, [dispatch, order, t])

  useEffect(() => {
    handleExpire()
  }, [handleExpire])

  const nextActionHint = useMemo(() => {
    if (!order) return ''
    if (order.status === 'disputed') return t('p2p.order.hint.disputed')
    if (order.status === 'cancelled') return t('p2p.order.hint.cancelled')
    if (order.status === 'completed') return t('p2p.order.hint.completed')
    if (order.status === 'created') {
      return isBuyer
        ? t('p2p.order.hint.buyerPay', { name: order.sellerName })
        : t('p2p.order.hint.sellerWait', { name: order.buyerName })
    }
    if (order.status === 'waiting_payment') {
      return isSeller
        ? t('p2p.order.hint.sellerConfirm', { name: order.buyerName })
        : t('p2p.order.hint.buyerWait', { name: order.sellerName })
    }
    return ''
  }, [isBuyer, isSeller, order, t])

  if (!order || (!isParty && !isStaff))
    return <Card>{t('p2p.order.notFound')}</Card>

  const myProofUploaded = order.proofs?.some((proof) => proof.userId === user.id)
  const buyerProofs = order.proofs?.filter((proof) => proof.userId === order.buyerId) || []
  const isTerminal = ['completed', 'cancelled'].includes(order.status)
  const isDisputed = order.status === 'disputed' || Boolean(dispute)
  const actionsLocked = isTerminal || isDisputed
  const otherPartyId = isBuyer ? order.sellerId : order.buyerId
  const otherPartyName = isBuyer ? order.sellerName : order.buyerName
  const statusMeta = ORDER_STATUS_KEYS[order.status] || { tone: 'info' }

  async function handleProofUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || actionsLocked) return
    setUploading(true)
    try {
      const { path } = await trackProofUpload((onProgress) =>
        storageService.uploadP2POrderProof(user.id, order.id, file, { onProgress }),
      )
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
      setPreviewUrl(signedUrl)
    } catch {
      dispatch(
        addToast({ title: t('common.error'), message: t('common.retryLater'), tone: 'error' }),
      )
    }
  }

  function runConfirmedAction() {
    if (confirmAction === 'markPaid') {
      dispatch(updateOrderStatus({ id: order.id, status: 'waiting_payment' }))
    } else if (confirmAction === 'confirmReceived') {
      dispatch(updateOrderStatus({ id: order.id, status: 'completed' }))
    } else if (confirmAction === 'cancel') {
      dispatch(updateOrderStatus({ id: order.id, status: 'cancelled' }))
    } else if (confirmAction === 'dispute') {
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
    setConfirmAction(null)
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

  const countdownDueAt =
    order.status === 'created'
      ? order.paymentDueAt
      : order.status === 'waiting_payment'
        ? order.confirmDueAt
        : null
  const countdownLabel =
    order.status === 'created'
      ? t('p2p.order.countdown.payment')
      : t('p2p.order.countdown.confirm')

  return (
    <div className="grid gap-6">
      <PageHeader title={t('p2p.order.title')} actions={<BackButton fallback="/p2p" />} />

      <P2PNoEscrowBanner />

      {isDisputed ? (
        <Card className="border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div className="grid gap-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
              <p className="font-bold">{t('p2p.order.disputedBanner')}</p>
              {dispute ? (
                <p className="text-xs opacity-90">
                  {t('p2p.order.disputeOpen', { status: dispute.status, reason: dispute.reason })}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
              {t('p2p.order.amount')}
            </p>
            <h2 className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">
              {formatMoney(order.amount, order.fromCurrency)}
              <span className="ml-2 text-base font-bold text-[var(--app-text-muted)]">
                → {order.toCurrency}
              </span>
            </h2>
          </div>
          <Badge tone={statusMeta.tone}>{orderStatusLabel(order.status)}</Badge>
        </div>

        <P2POrderStatusBar status={order.status} />

        {countdownDueAt && !actionsLocked ? (
          <P2PCountdown
            dueAt={countdownDueAt}
            label={countdownLabel}
            onExpire={order.status === 'created' ? handleExpire : undefined}
          />
        ) : null}

        <p className="rounded-2xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm font-medium leading-6 text-[var(--app-text)]">
          {nextActionHint}
        </p>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label={t('p2p.order.rate')} value={order.rate} />
          <Row label={t('p2p.order.fees')} value={formatMoney(order.fee, order.fromCurrency)} />
          {order.method ? <Row label={t('p2p.detail.method')} value={order.method} /> : null}
          <Row
            label={isBuyer ? t('p2p.order.seller') : t('p2p.order.buyer')}
            value={otherPartyName}
          />
          {order.createdAt ? (
            <Row label={t('p2p.order.createdAt')} value={formatDate(order.createdAt)} />
          ) : null}
        </div>

        {(receivePhone || receiveName) && isBuyer ? (
          <div className="rounded-2xl border border-brand-200/70 bg-brand-50/70 p-4 dark:border-brand-800/50 dark:bg-brand-950/30">
            <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
              {t('p2p.order.payToTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{t('p2p.order.payToHint')}</p>
            <div className="mt-3 grid gap-2 text-sm">
              {receiveMethod ? <Row label={t('p2p.detail.method')} value={receiveMethod} /> : null}
              {receiveName ? <Row label={t('p2p.order.receiveName')} value={receiveName} /> : null}
              {receivePhone ? (
                <Row label={t('p2p.order.receivePhone')} value={receivePhone} />
              ) : null}
            </div>
          </div>
        ) : null}

        {(receivePhone || receiveName) && isSeller ? (
          <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm">
            <p className="font-bold">{t('p2p.order.yourReceiveTitle')}</p>
            <div className="mt-2 grid gap-2">
              {receiveName ? <Row label={t('p2p.order.receiveName')} value={receiveName} /> : null}
              {receivePhone ? (
                <Row label={t('p2p.order.receivePhone')} value={receivePhone} />
              ) : null}
            </div>
          </div>
        ) : null}

        <P2PReputationBadge userId={otherPartyId} orders={orders} reviews={reviews} />

        {isParty ? (
          <ContactButton
            ownerId={otherPartyId}
            relatedEntity={order}
            relatedId={order.id}
            relatedPath={`/p2p/orders/${order.id}`}
            relatedTitle={t('p2p.order.receiptTitle', { id: order.id })}
            relatedType="p2p"
            variant="secondary"
          />
        ) : null}

        {!actionsLocked && isParty ? (
          <div className="grid gap-2">
            {order.status === 'created' && isBuyer ? (
              <Button
                icon={FiClock}
                disabled={!myProofUploaded}
                onClick={() => setConfirmAction('markPaid')}
              >
                {t('p2p.order.markPaid')}
              </Button>
            ) : null}
            {order.status === 'waiting_payment' && isSeller ? (
              <Button icon={FiCheckCircle} onClick={() => setConfirmAction('confirmReceived')}>
                {t('p2p.order.confirmReceived')}
              </Button>
            ) : null}
            {order.status === 'created' && isBuyer && !myProofUploaded ? (
              <p className="text-xs text-[var(--app-text-muted)]">{t('p2p.order.markPaidHint')}</p>
            ) : null}
          </div>
        ) : null}

        {!actionsLocked && isParty ? (
          <div className="grid gap-3 border-t border-[var(--app-border)] pt-4">
            <div className="flex flex-wrap gap-2">
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
              {order.status === 'created' ? (
                <Button
                  icon={FiXCircle}
                  variant="danger"
                  onClick={() => setConfirmAction('cancel')}
                >
                  {t('p2p.order.cancel')}
                </Button>
              ) : null}
            </div>
            {proofProgress.active ||
            proofProgress.phase === 'done' ||
            proofProgress.phase === 'error' ? (
              <UploadProgress progress={proofProgress} compact />
            ) : null}
          </div>
        ) : null}

        {order.proofs?.length ? (
          <div className="grid gap-2">
            <h3 className="text-sm font-black">{t('p2p.order.proofsTitle')}</h3>
            {order.proofs.map((proof) => (
              <div
                key={proof.id}
                className="flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <FiFileText className="shrink-0" />
                  <FileNameText name={proof.name} className="font-medium" maxLength={28} />
                  <Badge tone={proof.userId === order.buyerId ? 'info' : 'slate'} className="shrink-0 !text-[10px]">
                    {proof.userId === order.buyerId
                      ? t('p2p.order.proofBuyer')
                      : t('p2p.order.proofSeller')}
                  </Badge>
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
            {order.status === 'waiting_payment' && isSeller && !buyerProofs.length ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('p2p.order.noBuyerProofYet')}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-black">{t('p2p.order.timeline')}</h2>
          <div className="mt-5 grid gap-4">
            {(order.timeline || []).map((event) => (
              <div key={`${event.status}-${event.at}-${event.note || ''}`} className="flex gap-3">
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
          {dispute || isDisputed ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {t('p2p.order.disputeFrozen')}
            </p>
          ) : isTerminal || !isParty ? (
            <p className="mt-4 text-sm text-[var(--app-text-muted)]">{t('p2p.order.disputeUnavailable')}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-xs leading-5 text-[var(--app-text-muted)]">
                {t('p2p.order.disputeHelp')}
              </p>
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
                onClick={() => setConfirmAction('dispute')}
              >
                {isSeller && order.status === 'waiting_payment'
                  ? t('p2p.order.openDisputeNoReceive')
                  : t('p2p.order.openDispute')}
              </Button>
            </div>
          )}
        </Card>

        {order.status === 'completed' && isParty ? (
          <Card className="lg:col-span-2 border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20">
            <h2 className="font-black">{t('p2p.order.rateTitle')}</h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              {t('p2p.order.rateIntro', { name: otherPartyName })}
            </p>
            <div className="mt-4 grid gap-3 sm:max-w-md">
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

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === 'markPaid'
            ? t('p2p.order.confirm.markPaidTitle')
            : confirmAction === 'confirmReceived'
              ? t('p2p.order.confirm.finalizeTitle')
              : confirmAction === 'cancel'
                ? t('p2p.order.confirm.cancelTitle')
                : t('p2p.order.confirm.disputeTitle')
        }
      >
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            {confirmAction === 'markPaid'
              ? t('p2p.order.confirm.markPaidBody')
              : confirmAction === 'confirmReceived'
                ? t('p2p.order.confirm.finalizeBody')
                : confirmAction === 'cancel'
                  ? t('p2p.order.confirm.cancelBody')
                  : t('p2p.order.confirm.disputeBody')}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={confirmAction === 'cancel' || confirmAction === 'dispute' ? 'danger' : 'primary'}
              onClick={runConfirmedAction}
            >
              {confirmAction === 'markPaid'
                ? t('p2p.order.confirm.markPaidCta')
                : confirmAction === 'confirmReceived'
                  ? t('p2p.order.confirm.finalizeCta')
                  : confirmAction === 'cancel'
                    ? t('p2p.order.confirm.cancelCta')
                    : t('p2p.order.openDispute')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        title={t('p2p.order.proofPreview')}
        size="large"
      >
        {previewUrl ? (
          <div className="grid gap-3">
            <img
              src={previewUrl}
              alt={t('p2p.order.proofPreview')}
              className="max-h-[70vh] w-full rounded-xl object-contain bg-[var(--app-surface-muted)]"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 dark:text-brand-300"
            >
              {t('p2p.order.openProofTab')} <FiExternalLink />
            </a>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  )
}
