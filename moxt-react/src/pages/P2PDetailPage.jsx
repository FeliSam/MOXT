import { useState } from 'react'
import { FiCheckCircle, FiClock, FiCreditCard, FiRepeat, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { ContactButton } from '../features/communications/ContactButton'
import { P2PNoEscrowBanner } from '../features/p2p/components/P2PNoEscrowBanner'
import { P2PReputationBadge } from '../features/p2p/components/P2PReputationBadge'
import { acceptOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee } from '../features/p2p/p2pUtils'
import { selectPlatformFees } from '../features/admin/platformRatesSlice'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { formatMoney } from '../features/transfers/transferUtils'

export function P2PDetailPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offerId } = useParams()
  const { requireP2PAccept } = useSecurityGate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const platformFees = useSelector(selectPlatformFees)
  const offer = useSelector((state) => state.p2p.offers.find((item) => item.id === offerId))
  const orders = useSelector((state) => state.p2p.orders)
  const reviews = useSelector((state) => state.reviews.items)

  if (!offer) return <EmptyState title={t('p2p.detail.notFound')} />

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
            label: t('p2p.detail.conversion'),
            value: `${offer.fromCurrency} → ${offer.toCurrency}`,
          },
          { icon: FiCreditCard, label: t('p2p.detail.method'), value: offer.method },
          { icon: FiClock, label: t('p2p.detail.status'), value: offer.status },
          { icon: FiUser, label: t('p2p.detail.proposedBy'), value: offer.ownerName },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
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
            <p className="mt-5 rounded-xl bg-[var(--app-surface-muted)] p-4 text-sm">
              {offer.comment}
            </p>
          ) : null}
        </Card>
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
            {offer.status === 'active' && offer.ownerId !== user.id ? (
              <Button icon={FiCheckCircle} onClick={requestAccept}>
                {t('p2p.detail.acceptOffer')}
              </Button>
            ) : null}
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--app-text-muted)]">
            {t('p2p.detail.acceptNote')}
          </p>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={t('p2p.detail.exchangeDetails')}>
          <DetailFacts
            items={[
              {
                label: t('p2p.detail.availableAmount'),
                value: formatMoney(offer.amount, offer.fromCurrency),
              },
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
