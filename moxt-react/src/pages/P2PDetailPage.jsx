import { useState } from 'react'
import { FiClock, FiCreditCard, FiRepeat, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { DetailFloatingActions } from '../components/ui/DetailFloatingActions'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LinkifiedText } from '../components/ui/LinkifiedText'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { SwipeToAccept } from '../components/ui/SwipeToAccept'
import { useLanguage } from '../contexts/useLanguage'
import { ContactButton } from '../features/communications/ContactButton'
import { P2PNoEscrowBanner } from '../features/p2p/components/P2PNoEscrowBanner'
import { P2PReputationBadge } from '../features/p2p/components/P2PReputationBadge'
import { acceptOffer, updateOfferStatus } from '../features/p2p/p2pSlice'
import { calculateP2PFee, p2pReceivedFromOffered } from '../features/p2p/p2pUtils'
import { selectPlatformFees } from '../features/admin/platformRatesSlice'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { formatMoney } from '../features/transfers/transferUtils'
import { useP2pCatalogRealtime } from '../features/p2p/useP2pRealtime'
import { addToast } from '../features/ui/uiSlice'

export function P2PDetailPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offerId } = useParams()
  useP2pCatalogRealtime()
  const { requireP2PAccept } = useSecurityGate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const platformFees = useSelector(selectPlatformFees)
  const offer = useSelector((state) => state.p2p.offers.find((item) => item.id === offerId))
  const orders = useSelector((state) => state.p2p.orders)
  const reviews = useSelector((state) => state.reviews.items)

  if (!offer) return <EmptyState title={t('p2p.detail.notFound')} />

  const isOwner = offer.ownerId === user.id
  const canEdit = isOwner && ['active', 'archived'].includes(offer.status)
  const editPath = `/p2p/${offer.id}/edit`
  const equivalentAmount = p2pReceivedFromOffered(offer.amount, offer.rate)

  function requestAccept() {
    if (!requireP2PAccept()) return
    setConfirmOpen(true)
  }

  function confirmAccept() {
    const action = dispatch(
      acceptOffer({ buyer: user, offer, feePercent: platformFees.p2pFeePercent }),
    )
    setConfirmOpen(false)
    if (action.payload?.id) navigate(`/p2p/orders/${action.payload.id}`)
  }

  function archiveOffer() {
    dispatch(updateOfferStatus({ id: offer.id, status: 'archived' }))
    dispatch(
      addToast({
        title: t('p2p.detail.archiveToastTitle'),
        message: t('p2p.detail.archiveToastMessage'),
        tone: 'success',
      }),
    )
  }

  function reactivateOffer() {
    dispatch(updateOfferStatus({ id: offer.id, status: 'active' }))
    dispatch(
      addToast({
        title: t('p2p.detail.reactivateToastTitle'),
        message: t('p2p.detail.reactivateToastMessage'),
        tone: 'success',
      }),
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={t('p2p.detail.title', {
          amount: formatMoney(offer.amount, offer.fromCurrency),
          currency: offer.toCurrency,
        })}
        actions={<BackButton fallback="/p2p" />}
      />
      <P2PNoEscrowBanner />
      <DetailMetrics
        items={[
          {
            icon: FiRepeat,
            label: t('p2p.detail.equivalent'),
            value: equivalentAmount
              ? formatMoney(equivalentAmount, offer.toCurrency)
              : `${offer.fromCurrency} → ${offer.toCurrency}`,
          },
          { icon: FiCreditCard, label: t('p2p.detail.method'), value: offer.method },
          { icon: FiClock, label: t('p2p.detail.status'), value: offer.status },
          { icon: FiUser, label: t('p2p.detail.proposedBy'), value: offer.ownerName },
        ]}
      />
      <div className={`grid gap-5 ${isOwner ? '' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
        <Card>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">{t('p2p.detail.conditions')}</h2>
            <Badge tone={offer.status === 'active' ? 'success' : 'warning'}>{offer.status}</Badge>
          </div>
          <div className="mt-5 grid gap-3 text-sm">
            <Row
              label={t('p2p.detail.proposedAmount')}
              value={formatMoney(offer.amount, offer.fromCurrency)}
            />
            {equivalentAmount ? (
              <div className="flex justify-between gap-4 rounded-xl bg-[color-mix(in_srgb,var(--app-teal)_8%,var(--app-surface-muted))] px-3 py-2.5 ring-1 ring-[color-mix(in_srgb,var(--app-teal)_14%,transparent)]">
                <span className="text-[var(--app-text-muted)]">{t('p2p.detail.equivalent')}</span>
                <strong className="tabular-nums">{formatMoney(equivalentAmount, offer.toCurrency)}</strong>
              </div>
            ) : null}
            <Row label={t('p2p.detail.soughtCurrency')} value={offer.toCurrency} />
            <Row label={t('p2p.detail.rate')} value={offer.rate} />
            <Row label={t('p2p.detail.method')} value={offer.method} />
            <Row
              label={t('p2p.detail.estimatedFees')}
              value={formatMoney(
                calculateP2PFee(offer.amount, offer.fromCurrency),
                offer.fromCurrency,
              )}
            />
          </div>
          <P2PReputationBadge
            userId={offer.ownerId}
            orders={orders}
            reviews={reviews}
            className="mt-4"
          />
          {offer.comment ? (
            <LinkifiedText
              as="p"
              text={offer.comment}
              preserveWhitespace="pre-line"
              className="mt-5 rounded-xl bg-[var(--app-surface-muted)] p-4 text-sm"
            />
          ) : null}
        </Card>
        {!isOwner ? (
          <Card>
            <h2 className="font-black">{t('p2p.detail.contactOrAccept')}</h2>
            <div className="mt-5 grid gap-3">
              <ContactButton
                ownerId={offer.ownerId}
                relatedEntity={offer}
                relatedId={offer.id}
                relatedPath={`/p2p/${offer.id}`}
                relatedTitle={t('p2p.detail.relatedTitle', {
                  from: offer.fromCurrency,
                  to: offer.toCurrency,
                })}
                relatedType="p2p"
                variant="secondary"
              />
              {offer.status === 'active' ? (
                <SwipeToAccept
                  label={t('p2p.page.swipeToAccept')}
                  onComplete={requestAccept}
                />
              ) : null}
            </div>
            <p className="mt-5 text-xs leading-5 text-[var(--app-text-muted)]">
              {t('p2p.detail.acceptNote')}
            </p>
          </Card>
        ) : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={t('p2p.detail.exchangeDetails')}>
          <DetailFacts
            items={[
              {
                label: t('p2p.detail.availableAmount'),
                value: formatMoney(offer.amount, offer.fromCurrency),
              },
              ...(equivalentAmount
                ? [
                    {
                      label: t('p2p.detail.equivalent'),
                      value: formatMoney(equivalentAmount, offer.toCurrency),
                    },
                  ]
                : []),
              { label: t('p2p.detail.requestedCurrency'), value: offer.toCurrency },
              { label: t('p2p.detail.proposedRate'), value: offer.rate },
              {
                label: t('p2p.detail.fees'),
                value: formatMoney(
                  calculateP2PFee(offer.amount, offer.fromCurrency),
                  offer.fromCurrency,
                ),
              },
              { label: t('p2p.detail.method'), value: offer.method },
              {
                label: t('p2p.detail.profile'),
                value: offer.businessId ? t('p2p.page.business') : t('p2p.page.individual'),
              },
              { label: t('p2p.detail.reference'), value: offer.id },
            ]}
          />
        </DetailSection>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('p2p.acceptConfirm.title')}
      >
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            {t('p2p.acceptConfirm.body')}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmAccept}>{t('p2p.acceptConfirm.cta')}</Button>
          </div>
        </div>
      </Modal>

      <DetailFloatingActions
        isOwner={isOwner}
        ownerId={offer.ownerId}
        entity={offer}
        relatedId={offer.id}
        relatedPath={`/p2p/${offer.id}`}
        relatedType="p2p"
        title={t('p2p.detail.relatedTitle', {
          from: offer.fromCurrency,
          to: offer.toCurrency,
        })}
        editTo={canEdit ? editPath : undefined}
        editLabel={t('p2p.detail.editOffer')}
        onArchive={isOwner && offer.status === 'active' ? archiveOffer : undefined}
        archiveLabel={t('p2p.detail.archiveOffer')}
        onReactivate={isOwner && offer.status === 'archived' ? reactivateOffer : undefined}
        reactivateLabel={t('p2p.detail.reactivateOffer')}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--app-border)] pb-3">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
