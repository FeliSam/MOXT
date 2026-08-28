import { FiArrowRight, FiClock, FiCreditCard, FiDollarSign, FiRepeat, FiUser } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { calculateP2PFee, p2pReceivedFromOffered } from '../../p2p/p2pUtils'
import { formatDate, formatMoney } from '../../transfers/transferUtils'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedNeutralCard, FeedNeutralPanel, FeedNeutralPill, FeedNeutralRow } from '../FeedNeutralPanel'
import { FeedSlideShell } from '../FeedSlideShell'

function P2pMetaChip({ icon: Icon, label }) {
  if (!label) return null
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-2xl bg-white/10 px-2.5 py-2.5 ring-1 ring-inset ring-white/10 sm:gap-2 sm:px-3">
      <Icon className="shrink-0 text-white/70" aria-hidden />
      <p className="min-w-0 truncate text-[12px] font-bold text-white sm:text-[13px]">{label}</p>
    </div>
  )
}

export function P2pFeedSlide({ item, index, active = true }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const offer = item.source || {}
  const fromCurrency = offer.fromCurrency || item.stats?.fromCurrency || ''
  const toCurrency = offer.toCurrency || item.stats?.toCurrency || ''
  const amount = Number(offer.amount || item.stats?.amount) || 0
  const rate = Number(offer.rate || item.stats?.rate) || 0
  const received = p2pReceivedFromOffered(amount, rate)
  const offeredLabel = amount && fromCurrency ? formatMoney(amount, fromCurrency) : ''
  const receivedLabel = received && toCurrency ? formatMoney(received, toCurrency) : ''
  const rateLabel = rate ? p3('feed.p2p.rate', { rate }) : ''
  const feeAmount = calculateP2PFee(amount, fromCurrency)
  const feeLabel =
    feeAmount > 0 && fromCurrency ? p3('feed.p2p.fees', { amount: formatMoney(feeAmount, fromCurrency) }) : ''
  const method = offer.method || ''
  const ownerName = item.publisher?.name || offer.ownerName || offer.businessName || ''
  const comment = (offer.comment || item.caption || '').trim()
  const isBusiness = Boolean(offer.businessId)

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={item.publisher}
      title={null}
      caption={item.caption}
      captionLines={1}
      active={active}
      ctaLabel={p3('feed.cta.p2p')}
      ctaTo={item.href}
    >
      <FeedNeutralPanel gradient="from-cyan-700 via-teal-800 to-slate-950" cover="" bucket="listings">
        <FeedNeutralCard
          eyebrow={p3('feed.p2p.pairLabel')}
          badges={
            <>
              {offeredLabel ? <FeedNeutralPill tone="light">{offeredLabel}</FeedNeutralPill> : null}
              {rateLabel ? <FeedNeutralPill>{rateLabel}</FeedNeutralPill> : null}
              {isBusiness ? (
                <FeedNeutralPill>{t('p2p.page.business')}</FeedNeutralPill>
              ) : ownerName ? (
                <FeedNeutralPill>{t('p2p.page.individual')}</FeedNeutralPill>
              ) : null}
            </>
          }
        >
          <div className="mt-3 grid gap-3">
            <FeedNeutralRow
              icon={FiRepeat}
              iconClass="bg-cyan-400/20 text-cyan-100 ring-cyan-300/30"
              label={p3('feed.p2p.amount')}
              value={offeredLabel}
            />

            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  {p3('feed.p2p.from')}
                </p>
                <p className="truncate text-[1.2rem] font-black tracking-tight text-white">
                  {fromCurrency || '—'}
                </p>
              </div>
              <FiArrowRight className="shrink-0 text-white/50" aria-hidden />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  {p3('feed.p2p.to')}
                </p>
                <p className="truncate text-[1.2rem] font-black tracking-tight text-white">
                  {toCurrency || '—'}
                </p>
              </div>
            </div>

            {receivedLabel ? (
              <p className="rounded-2xl bg-white/10 px-3 py-2.5 text-center text-[13px] font-bold text-white ring-1 ring-inset ring-white/10">
                {p3('feed.p2p.receives', { amount: receivedLabel })}
              </p>
            ) : null}

            {(method || feeLabel) ? (
              <div className={`grid gap-2 ${method && feeLabel ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {method ? <P2pMetaChip icon={FiCreditCard} label={method} /> : null}
                {feeLabel ? <P2pMetaChip icon={FiDollarSign} label={feeLabel} /> : null}
              </div>
            ) : null}

            <FeedNeutralRow
              icon={FiUser}
              iconClass="bg-teal-400/20 text-teal-100 ring-teal-300/30"
              label={p3('feed.p2p.proposedBy')}
              value={ownerName}
            />

            {offer.createdAt ? (
              <FeedNeutralRow
                icon={FiClock}
                iconClass="bg-slate-400/20 text-slate-100 ring-slate-300/30"
                label={p3('feed.p2p.publishedOn')}
                value={formatDate(offer.createdAt)}
              />
            ) : null}

            {comment ? (
              <p className="line-clamp-2 rounded-2xl bg-white/5 px-3 py-2.5 text-[12px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/10">
                {comment}
              </p>
            ) : null}
          </div>
        </FeedNeutralCard>
      </FeedNeutralPanel>
    </FeedSlideShell>
  )
}
