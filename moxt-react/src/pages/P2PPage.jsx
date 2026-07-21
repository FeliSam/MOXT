import { FiArrowRight, FiPlus, FiUsers } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { acceptOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee } from '../features/p2p/p2pUtils'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import { useSecurityGate } from '../features/security/useSecurityGate'

export function P2PPage() {
  const { t } = useLanguage()
  useScrollToSecondSection()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tab, setTab] = useState('active')
  const [filters, setFilters] = useState({
    query: '',
    fromCurrency: '',
    toCurrency: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requireP2PPublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const offers = useSelector((state) => state.p2p.offers)
  const orders = useSelector((state) => state.p2p.orders)
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const availableCurrencies = transferCurrenciesForCountry(originCountry)
  const filteredOffers = useMemo(
    () =>
      offers.filter((offer) => {
        const haystack =
          `${offer.ownerName} ${offer.method} ${offer.comment} ${offer.fromCurrency} ${offer.toCurrency}`.toLowerCase()
        return (
          availableCurrencies.includes(offer.fromCurrency) &&
          availableCurrencies.includes(offer.toCurrency) &&
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.fromCurrency || offer.fromCurrency === filters.fromCurrency) &&
          (!filters.toCurrency || offer.toCurrency === filters.toCurrency)
        )
      }),
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

  function clearFilters() {
    setFilters({ query: '', fromCurrency: '', toCurrency: '' })
  }

  function openPublish() {
    if (requireP2PPublish()) navigate('/p2p/publish')
  }

  function handleAccept(offer) {
    const action = dispatch(acceptOffer({ buyer: user, offer }))
    if (action.payload?.id) navigate(`/p2p/orders/${action.payload.id}`)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={t('p2p.page.title')}
        stats={[{ label: t('p2p.page.activeOffers'), value: activeOffers.length }]}
        actions={
          <Button icon={FiPlus} onClick={openPublish}>
            {t('p2p.page.proposeOffer')}
          </Button>
        }
      />

      <div className="grid gap-5">
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
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {displayedOffers.length ? (
            displayedOffers.map((offer, index) => (
              <RevealListItem key={offer.id} index={index}>
                <Card
                  variant="interactive"
                  className={`group flex h-full flex-col overflow-hidden !border-0 p-4 shadow-none ring-0 transition-shadow duration-300 sm:p-5 ${tab === 'archived' ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                      <FiUsers />
                    </span>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <Badge tone={offer.status === 'active' ? 'success' : 'warning'}>
                        {offer.status === 'active'
                          ? t('p2p.page.statusActive')
                          : t('p2p.page.statusArchived')}
                      </Badge>
                      {offer.businessId ? (
                        <VerifiedBadge size="sm" label={t('p2p.page.business')} />
                      ) : (
                        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black text-[var(--app-text-faint)]">
                          {t('p2p.page.individual')}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="mt-3.5 truncate text-sm font-black tabular-nums leading-snug sm:text-base">
                    {t('p2p.page.amountTo', {
                      amount: formatMoney(offer.amount, offer.fromCurrency),
                      currency: offer.toCurrency,
                    })}
                  </h2>
                  <EntityVerifiedName
                    as="p"
                    name={offer.ownerName}
                    userId={offer.ownerId}
                    businessId={offer.businessId}
                    className="mt-1.5 text-xs text-[var(--app-text-faint)]"
                    nameClassName="truncate"
                  />

                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                    <div className="min-w-0 flex-1 text-center">
                      <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                        {offer.fromCurrency}
                      </p>
                    </div>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
                      <FiArrowRight className="text-xs" />
                    </span>
                    <div className="min-w-0 flex-1 text-center">
                      <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                        {offer.toCurrency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid flex-1 content-start gap-2 sm:grid-cols-2">
                    <P2PMetric
                      value={t('p2p.page.rateValue', { rate: offer.rate })}
                      label={offer.method}
                    />
                    <P2PMetric
                      value={formatMoney(
                        calculateP2PFee(offer.amount, offer.fromCurrency),
                        offer.fromCurrency,
                      )}
                      label={t('p2p.page.estimatedFees')}
                    />
                  </div>

                  {offer.comment ? (
                    <p className="mt-3 line-clamp-2 text-xs text-[var(--app-text-muted)]">
                      {offer.comment}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2">
                    {tab === 'active' && offer.status === 'active' && offer.ownerId !== user.id ? (
                      <Button
                        size="sm"
                        className="min-h-10 flex-1 sm:min-h-11"
                        onClick={() => handleAccept(offer)}
                      >
                        {t('p2p.page.accept')}
                      </Button>
                    ) : null}
                    <Link
                      to={`/p2p/${offer.id}`}
                      className={
                        tab === 'active' && offer.status === 'active' && offer.ownerId !== user.id
                          ? 'shrink-0'
                          : 'flex-1'
                      }
                    >
                      <span className="flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 text-center text-xs font-black text-white transition group-hover:bg-brand-800 sm:min-h-11 sm:text-sm dark:bg-brand-600">
                        {t('p2p.page.detail')} <FiArrowRight className="text-xs" />
                      </span>
                    </Link>
                  </div>
                </Card>
              </RevealListItem>
            ))
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
          {orders.length ? (
            <div className="mt-3">
              <h2 className="mb-3 text-lg font-black">{t('p2p.page.recentOrders')}</h2>
              <div className="grid gap-3">
                {orders
                  .filter((order) => [order.buyerId, order.sellerId].includes(user.id))
                  .map((order) => (
                    <Link key={order.id} to={`/p2p/orders/${order.id}`}>
                      <Card className="flex items-center justify-between gap-4">
                        <div>
                          <strong>{order.id}</strong>
                          <p className="mt-1 text-xs text-slate-500">
                            {t('p2p.page.orderDirection', {
                              seller: order.sellerName,
                              buyer: order.buyerName,
                            })}
                          </p>
                        </div>
                        <FiArrowRight className="text-brand-700" />
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          ) : null}
        </CatalogGrid>
      </div>
    </div>
  )
}

function P2PMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <strong className="block truncate">{value}</strong>
      <span className="mt-1 block truncate text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
