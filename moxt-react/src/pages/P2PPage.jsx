import { FiArrowRight, FiPlus, FiStar, FiUsers } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { P2PNoEscrowBanner } from '../features/p2p/components/P2PNoEscrowBanner'
import { P2POfferCard } from '../features/p2p/components/P2POfferCard'
import { P2PTrustChecklist } from '../features/p2p/components/P2PTrustChecklist'
import { acceptOffer } from '../features/p2p/p2pSlice'
import { selectPlatformFees } from '../features/admin/platformRatesSlice'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { formatDate } from '../features/transfers/transferUtils'
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
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')
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
        .filter((order) => user?.id && [order.buyerId, order.sellerId].includes(user.id))
        .sort(byCreatedAtDesc),
    [orders, user],
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
              const canAccept =
                tab === 'active' &&
                offer.status === 'active' &&
                Boolean(user?.id) &&
                offer.ownerId !== user.id
              return (
              <RevealListItem key={offer.id} index={index} className="min-w-0 max-w-full">
                <P2POfferCard
                  offer={offer}
                  orders={orders}
                  reviews={reviews}
                  archived={tab === 'archived'}
                  canAccept={canAccept}
                  onAccept={requestAccept}
                />
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

