import { useEffect, useMemo, useState } from 'react'
import { FiStar } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useLanguage } from '../../contexts/useLanguage'
import { addToast } from '../ui/uiSlice'
import { selectPublisherSubscription } from '../account/subscriptionSelectors'
import { giftStarsToPublisher, loadStarsBalance } from './starsSlice'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

const GIFT_AMOUNTS = [5, 10, 25, 50]

export function StarsGiftButton({
  publisherType,
  publisherId,
  publisherName = '',
  size = 'sm',
  className = '',
  guestKey: _guestKey = 'videos.feed.guestSubscribe',
}) {
  const { t } = useLanguage()
  const starsEnabled = useStarsModuleEnabled()
  const user = useSelector((state) => state.auth.user)
  const subscription = useSelector((state) =>
    selectPublisherSubscription(state, user?.id, publisherType, publisherId),
  )
  const [open, setOpen] = useState(false)
  const isSubscribed = Boolean(subscription)
  const isSelf =
    publisherType === 'user' ? user?.id === publisherId : false

  if (!starsEnabled || !user?.id || !publisherId || isSelf || !isSubscribed) return null

  const chipClass =
    size === 'sm'
      ? 'grid size-7 shrink-0 place-items-center rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm transition active:scale-95 bg-amber-500/90 text-white'
      : ''

  return (
    <>
      {size === 'sm' ? (
        <button
          type="button"
          className={`${chipClass} ${className}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen(true)
          }}
          aria-label={t('stars.gift.trigger')}
          title={t('stars.gift.trigger')}
        >
          <FiStar className="text-sm" />
        </button>
      ) : (
        <Button
          className={className}
          size={size}
          variant="secondary"
          icon={FiStar}
          onClick={() => setOpen(true)}
        >
          {t('stars.gift.trigger')}
        </Button>
      )}
      <StarsGiftSheet
        open={open}
        onClose={() => setOpen(false)}
        publisherType={publisherType}
        publisherId={publisherId}
        publisherName={publisherName}
      />
    </>
  )
}

export function StarsGiftSheet({
  open,
  onClose,
  publisherType,
  publisherId,
  publisherName = '',
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const balance = useSelector((state) => state.stars.balance)
  const [amount, setAmount] = useState(GIFT_AMOUNTS[0])
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const paidBalance = useMemo(() => Number(balance?.paid_balance ?? balance?.paidBalance ?? 0), [balance])
  const canAfford = paidBalance >= amount

  useEffect(() => {
    if (!open) return
    dispatch(loadStarsBalance({ ownerType: 'user' }))
  }, [dispatch, open])

  async function handleConfirm() {
    if (!canAfford || submitting) return
    setSubmitting(true)
    try {
      const idempotencyKey = `gift:${publisherType}:${publisherId}:${Date.now()}`
      await dispatch(
        giftStarsToPublisher({
          recipientType: publisherType,
          recipientId: publisherId,
          amount,
          idempotencyKey,
          message: message.trim() || null,
        }),
      ).unwrap()
      dispatch(loadStarsBalance({ ownerType: 'user' }))
      dispatch(
        addToast({
          title: t('stars.gift.successTitle'),
          message: t('stars.gift.successBody', { amount, name: publisherName }),
          tone: 'success',
        }),
      )
      onClose?.()
      setMessage('')
    } catch (error) {
      dispatch(
        addToast({
          title: t('stars.gift.failedTitle'),
          message: error?.message || t('stars.gift.failedBody'),
          tone: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={t('stars.gift.title')}>
      <p className="text-sm leading-6 text-[var(--app-text-muted)]">
        {t('stars.gift.description', { name: publisherName || t('stars.gift.recipientFallback') })}
      </p>
      <p className="mt-2 text-xs font-semibold text-[var(--app-text-muted)]">
        {t('stars.gift.balance', { n: paidBalance })}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {GIFT_AMOUNTS.map((value) => {
          const active = amount === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(value)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active
                  ? 'bg-[var(--app-accent)] text-white'
                  : 'bg-[var(--app-surface-2)] text-[var(--app-text-muted)]'
              }`}
            >
              {value} ★
            </button>
          )
        })}
      </div>
      <textarea
        className="mt-4 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--app-accent)]"
        rows={2}
        maxLength={120}
        placeholder={t('stars.gift.messagePlaceholder')}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      {!canAfford ? (
        <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
          {t('stars.insufficientBody')}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={!canAfford || submitting}>
          {t('stars.gift.confirm', { amount })}
        </Button>
      </div>
    </Modal>
  )
}
