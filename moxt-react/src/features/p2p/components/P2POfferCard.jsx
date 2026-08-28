import { FiArrowRight, FiRepeat } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { EntityVerifiedName } from '../../../components/ui/EntityVerifiedName'
import { LinkifiedText } from '../../../components/ui/LinkifiedText'
import { SwipeToAccept } from '../../../components/ui/SwipeToAccept'
import { useLanguage } from '../../../contexts/useLanguage'
import { calculateP2PFee, p2pReceivedFromOffered } from '../p2pUtils'
import { formatDate, formatMoney } from '../../transfers/transferUtils'
import { P2PReputationBadge } from './P2PReputationBadge'

/**
 * Carte offre P2P — catalogue ou carrousel accueil.
 * `showActions={false}` : clic sur toute la carte → fiche, sans glisser / Détail.
 */
export function P2POfferCard({
  offer,
  orders = [],
  reviews = [],
  archived = false,
  canAccept = false,
  showActions = true,
  onAccept,
}) {
  const { t } = useLanguage()
  const feeAmount = calculateP2PFee(offer.amount, offer.fromCurrency)
  const equivalentAmount = p2pReceivedFromOffered(offer.amount, offer.rate)
  const title = t('p2p.page.amountTo', {
    amount: formatMoney(offer.amount, offer.fromCurrency),
    currency: offer.toCurrency,
  })

  return (
    <Card
      variant="interactive"
      className={`group relative flex h-full min-w-0 max-w-full flex-col overflow-hidden !p-0 ${
        archived ? 'opacity-80' : ''
      }`}
    >
      <Link to={`/p2p/${offer.id}`} className="absolute inset-0 z-[1]" aria-label={title} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-1 bg-gradient-to-r from-[var(--app-teal)] via-brand-500 to-[var(--app-cobalt)] opacity-80"
      />
      <div className="pointer-events-none relative z-[2] flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge tone={offer.status === 'active' ? 'success' : 'warning'}>
              {offer.status === 'active'
                ? t('p2p.page.statusActive')
                : t('p2p.page.statusArchived')}
            </Badge>
            {offer.businessId ? (
              <VerifiedBadge size="sm" label={t('p2p.page.business')} />
            ) : (
              <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
                {t('p2p.page.individual')}
              </span>
            )}
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--app-teal)_14%,var(--app-surface))] text-[var(--app-teal)] ring-1 ring-[color-mix(in_srgb,var(--app-teal)_22%,transparent)]">
            <FiRepeat className="text-sm" />
          </span>
        </div>

        <h2 className="mt-3.5 break-words text-lg font-black tabular-nums leading-tight tracking-tight sm:text-xl">
          {title}
        </h2>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <EntityVerifiedName
            as="span"
            name={offer.ownerName}
            userId={offer.ownerId}
            businessId={offer.businessId}
            className="text-xs text-[var(--app-text-muted)]"
            nameClassName="truncate font-semibold"
          />
          {offer.createdAt ? (
            <span className="text-[11px] text-[var(--app-text-faint)]">
              · {formatDate(offer.createdAt)}
            </span>
          ) : null}
        </div>
        <P2PReputationBadge
          userId={offer.ownerId}
          orders={orders}
          reviews={reviews}
          className="mt-2"
        />

        <div className="mt-4 rounded-[1.15rem] bg-[color-mix(in_srgb,var(--app-teal)_7%,var(--app-surface-muted))] p-3.5 ring-1 ring-[color-mix(in_srgb,var(--app-teal)_12%,transparent)]">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="rounded-lg bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--app-text)] shadow-sm">
              {offer.fromCurrency}
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--app-teal)] text-white shadow-sm">
              <FiArrowRight className="text-xs" />
            </span>
            <span className="rounded-lg bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--app-text)] shadow-sm">
              {offer.toCurrency}
            </span>
            <div className="ml-auto min-w-0 text-right">
              <p className="truncate text-sm font-black tabular-nums text-[var(--app-text)]">
                {offer.rate}
              </p>
              <p className="truncate text-[11px] font-semibold text-[var(--app-text-muted)]">
                {offer.method}
              </p>
            </div>
          </div>
          {equivalentAmount ? (
            <div className="mt-3 flex min-w-0 items-baseline justify-between gap-3 border-t border-[color-mix(in_srgb,var(--app-teal)_14%,transparent)] pt-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                {t('p2p.page.equivalent')}
              </span>
              <span className="min-w-0 truncate text-sm font-black tabular-nums text-[var(--app-text)]">
                {formatMoney(equivalentAmount, offer.toCurrency)}
              </span>
            </div>
          ) : null}
        </div>

        {feeAmount > 0 ? (
          <p className="mt-2.5 text-[11px] text-[var(--app-text-faint)]">
            {t('p2p.page.estimatedFees')}:{' '}
            <span className="font-semibold text-[var(--app-text-muted)]">
              {formatMoney(feeAmount, offer.fromCurrency)}
            </span>
          </p>
        ) : null}

        {offer.comment ? (
          <LinkifiedText
            as="p"
            text={offer.comment}
            preserveWhitespace="pre-line"
            className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--app-text-muted)]"
          />
        ) : null}

        {showActions ? (
          <div className="pointer-events-auto mt-auto flex min-w-0 flex-col gap-2 pt-4">
            {canAccept ? (
              <SwipeToAccept label={t('p2p.page.swipeToAccept')} onComplete={() => onAccept?.(offer)} />
            ) : null}
            <Link to={`/p2p/${offer.id}`} className="min-w-0 w-full">
              <span className="flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-teal)] px-3 text-center text-xs font-black text-white transition group-hover:brightness-110 sm:min-h-11 sm:px-4 sm:text-sm">
                {t('p2p.page.detail')} <FiArrowRight className="shrink-0 text-xs" />
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
