import { FiArrowRight, FiPlus, FiRepeat, FiStar, FiUsers } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LinkifiedText } from '../components/ui/LinkifiedText'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { SwipeToAccept } from '../components/ui/SwipeToAccept'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { P2PNoEscrowBanner } from '../features/p2p/components/P2PNoEscrowBanner'
import { P2PReputationBadge } from '../features/p2p/components/P2PReputationBadge'
import { P2PTrustChecklist } from '../features/p2p/components/P2PTrustChecklist'
import { acceptOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee, p2pReceivedFromOffered } from '../features/p2p/p2pUtils'
import { selectPlatformFees } from '../features/admin/platformRatesSlice'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { useP2pCatalogRealtime } from '../features/p2p/useP2pRealtime'

function byCreatedAtDesc(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
}

function userRatedOrder(order, userId) {
  return Boolean(order?.ratings?.some((entry) => entry.userId === userId))
}

export function P2PPage() {
  const { t } = useLanguage()
  useScrollToSecondSection()
  useP2pCatalogRealtime()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tab, setTab] = useState('active')
  const [filters, setFilters] = useState({
    query: '',
    fromCurrency: '',
    toCurrency: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requireP2PPublish, requireP2PAccept } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const platformFees = useSelector(selectPlatformFees)
  const offers = useSelector((state) => state.p2p.offers)
  const orders = useSelector((state) => state.p2p.orders)
  const reviews = useSelector((state) => state.reviews.items)
  const [acceptOfferTarget, setAcceptOfferTarget] = useState(null)
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const availableCurrencies = transferCurrenciesForCountry(originCountry)
  const filteredOffers = useMemo(
    () =>
      offers
        .filter((offer) => {
          const haystack =
            `${offer.ownerName} ${offer.method} ${offer.comment} ${offer.fromCurrency} ${offer.toCurrency}`.toLowerCase()
          return (
            availableCurrencies.includes(offer.fromCurrency) &&
            availableCurrencies.includes(offer.toCurrency) &&
            (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
            (!filters.fromCurrency || offer.fromCurrency === filters.fromCurrency) &&
            (!filters.toCurrency || offer.toCurrency === filters.toCurrency)
          )
        })
        .sort(byCreatedAtDesc),
    [availableCurrencies, filters, offers],
  )

  const activeOffers = useMemo(
    () => filteredOffers.filter((offer) => offer.status === 'active'),
    [filteredOffers],
  )

  const archivedOffers = useMemo(
    () => filteredOffers.filter((offer) => offer.status !== 'active'),
    [filteredOffers],
  )

  const displayedOffers = tab === 'active' ? activeOffers : archivedOffers

  const myOrders = useMemo(
    () =>
      orders
        .filter((order) => [order.buyerId, order.sellerId].includes(user.id))
        .sort(byCreatedAtDesc),
    [orders, user.id],
  )

  function clearFilters() {
    setFilters({ query: '', fromCurrency: '', toCurrency: '' })
  }

  function openPublish() {
    if (requireP2PPublish()) navigate('/p2p/publish')
  }

  function requestAccept(offer) {
    if (!requireP2PAccept()) return
    setAcceptOfferTarget(offer)
  }

  function confirmAccept() {
    if (!acceptOfferTarget) return
    const action = dispatch(
      acceptOffer({ buyer: user, offer: acceptOfferTarget, feePercent: platformFees.p2pFeePercent }),
    )
    setAcceptOfferTarget(null)
    if (action.payload?.id) navigate(`/p2p/orders/${action.payload.id}`)
  }

  return (
    <div className="grid min-w-0 max-w-full gap-7 overflow-x-clip">
      <PageHeader
        title={t('p2p.page.title')}
        stats={[{ label: t('p2p.page.activeOffers'), value: activeOffers.length }]}
        actions={
          <HeaderIslandButton
            icon={FiPlus}
            label={t('p2p.page.proposeOffer')}
            onClick={openPublish}
          />
        }
      />

      <P2PNoEscrowBanner />
      <P2PTrustChecklist />

      <div className="grid min-w-0 gap-5">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={displayedOffers.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder={t('p2p.page.searchPlaceholder')}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="p2p-filter-from"
              label={t('p2p.page.fromCurrency')}
              value={filters.fromCurrency}
              onChange={(event) =>
                setFilters((current) => ({ ...current, fromCurrency: event.target.value }))
              }
            >
              <option value="">{t('p2p.page.allCurrencies')}</option>
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <Select
              id="p2p-filter-to"
              label={t('p2p.page.toCurrency')}
              value={filters.toCurrency}
              onChange={(event) =>
                setFilters((current) => ({ ...current, toCurrency: event.target.value }))
              }
            >
              <option value="">{t('p2p.page.allCurrencies')}</option>
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>
        <CatalogArchiveTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'active', label: t('p2p.page.activeOffers'), count: activeOffers.length },
            { key: 'archived', label: t('p2p.page.archives'), count: archivedOffers.length },
          ]}
        />
        <CatalogGrid
          lazy={false}
          columns="grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3"
          className="min-w-0 w-full"
        >
          {displayedOffers.length ? (
            displayedOffers.map((offer, index) => {
              const feeAmount = calculateP2PFee(offer.amount, offer.fromCurrency)
              const equivalentAmount = p2pReceivedFromOffered(offer.amount, offer.rate)
              const canAccept =
                tab === 'active' && offer.status === 'active' && offer.ownerId !== user.id
              return (
              <RevealListItem key={offer.id} index={index} className="min-w-0 max-w-full">
                <Card
                  variant="interactive"
                  className={`group relative flex h-full min-w-0 max-w-full flex-col overflow-hidden !p-0 ${
                    tab === 'archived' ? 'opacity-80' : ''
                  }`}
                >
                  <Link
                    to={`/p2p/${offer.id}`}
                    className="absolute inset-0 z-[1]"
                    aria-label={t('p2p.page.amountTo', {
                      amount: formatMoney(offer.amount, offer.fromCurrency),
                      currency: offer.toCurrency,
                    })}
                  />
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
                      {t('p2p.page.amountTo', {
                        amount: formatMoney(offer.amount, offer.fromCurrency),
                        currency: offer.toCurrency,
                      })}
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

                    <div className="pointer-events-auto mt-auto flex min-w-0 flex-col gap-2 pt-4">
                      {canAccept ? (
                        <SwipeToAccept
                          label={t('p2p.page.swipeToAccept')}
                          onComplete={() => requestAccept(offer)}
                        />
                      ) : null}
                      <Link
                        to={`/p2p/${offer.id}`}
                        className="min-w-0 w-full"
                      >
                        <span className="flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-teal)] px-3 text-center text-xs font-black text-white transition group-hover:brightness-110 sm:min-h-11 sm:px-4 sm:text-sm">
                          {t('p2p.page.detail')} <FiArrowRight className="shrink-0 text-xs" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </Card>
              </RevealListItem>
              )
            })
          ) : (
            <EmptyState
              className="col-span-full"
              icon={FiUsers}
              tone="search"
              title={
                tab === 'active' ? t('p2p.page.emptyActiveTitle') : t('p2p.page.emptyArchiveTitle')
              }
              description={
                tab === 'active'
                  ? t('p2p.page.emptyActiveDescription')
                  : t('p2p.page.emptyArchiveDescription')
              }
              action={
                tab === 'active' ? (
                  <Button icon={FiPlus} onClick={openPublish}>
                    {t('p2p.page.proposeOffer')}
                  </Button>
                ) : undefined
              }
            />
          )}
          {myOrders.length ? (
            <div className="col-span-full mt-3">
              <h2 className="mb-3 text-lg font-black">{t('p2p.page.recentOrders')}</h2>
              <div className="grid gap-3">
                {myOrders.map((order) => {
                  const needsReview =
                    order.status === 'completed' && !userRatedOrder(order, user.id)
                  return (
                    <Link key={order.id} to={`/p2p/orders/${order.id}`} className="min-w-0">
                      <Card className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <strong className="block truncate">{order.id}</strong>
                          <p className="mt-1 text-xs text-slate-500">
                            {t('p2p.page.orderDirection', {
                              seller: order.sellerName,
                              buyer: order.buyerName,
                            })}
                          </p>
                          {order.createdAt ? (
                            <p className="mt-1 text-[11px] text-[var(--app-text-faint)]">
                              {formatDate(order.createdAt)}
                            </p>
                          ) : null}
                          {needsReview ? (
                            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              <FiStar className="text-xs" />
                              {t('p2p.page.leaveReview')}
                            </p>
                          ) : null}
                        </div>
                        <FiArrowRight className="shrink-0 text-brand-700" />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}
        </CatalogGrid>
      </div>

      <Modal
        open={Boolean(acceptOfferTarget)}
        onClose={() => setAcceptOfferTarget(null)}
        title={t('p2p.acceptConfirm.title')}
      >
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            {t('p2p.acceptConfirm.body')}
          </p>
          <P2PTrustChecklist />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setAcceptOfferTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmAccept}>{t('p2p.acceptConfirm.cta')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

