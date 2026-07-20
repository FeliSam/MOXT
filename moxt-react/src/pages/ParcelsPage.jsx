import { FiArrowRight, FiCalendar, FiPackage, FiPlus, FiUser } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { sortByCountryPriority, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { sortBySubscriptionPriority } from '@moxt/shared/utils/subscriptionUtils.js'
import { isStaffRole } from '../features/auth/roleUtils'
import {
  parcelProofLabelKey,
  parcelProofTone,
  resolveParcelProofStatus,
} from '../features/parcels/parcelProofUtils'
import { resolveParcelCountry } from '../features/marketplace/listingCatalogUtils'
import {
  parcelBrowseTabs,
  parcelCountryFilterOptions,
  parcelStatusFilterOptions,
} from '../features/parcels/parcelBrowseConfig'
import { formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function ParcelsPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tab, setTab] = useState('active')
  const [showMine, setShowMine] = useState(false)
  const [filters, setFilters] = useState({
    query: '',
    country: '',
    origin: '',
    destination: '',
    status: 'active',
  })
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const subscriptions = useSelector((state) => state.account.subscriptions || [])
  const { countries } = useGeographyOptions()
  const parcels = useSelector((state) => state.parcels.items)
  const userCountry = resolveUserCountryCode(user) || 'RU'
  const unfiltered = isStaffRole(user)
  const activeCountryCode =
    filters.country === 'ALL' || unfiltered ? null : filters.country || userCountry
  const today = new Date().toISOString().slice(0, 10)

  const isArchived = (parcel) =>
    parcel.status === 'completed' || (parcel.departureDate && parcel.departureDate < today)

  const visibleParcels = useMemo(
    () => {
      const filtered = parcels.filter((parcel) => {
        if (showMine && (parcel.ownerId !== user.id || parcel.businessId)) return false
        if (!showMine && isArchived(parcel)) return false
        const haystack =
          `${parcel.origin} ${parcel.destination} ${parcel.ownerName} ${parcel.conditions}`.toLowerCase()
        const from = parcel.fromCountry || parcel.originCountry
        const to = parcel.toCountry || parcel.destinationCountry
        const matchesCountry =
          showMine ||
          !activeCountryCode ||
          from === activeCountryCode ||
          to === activeCountryCode
        return (
          matchesCountry &&
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.origin || parcel.origin.toLowerCase().includes(filters.origin.toLowerCase())) &&
          (!filters.destination ||
            parcel.destination.toLowerCase().includes(filters.destination.toLowerCase())) &&
          (!filters.status || showMine || parcel.status === filters.status)
        )
      })
      return sortBySubscriptionPriority(
        sortByCountryPriority(filtered, userCountry, resolveParcelCountry),
        subscriptions,
        user?.id,
        'parcel',
      )
    },
    [activeCountryCode, filters, parcels, subscriptions, user?.id, userCountry, showMine, today, user.id],
  )

  const archivedParcels = useMemo(
    () => parcels.filter(isArchived),
    [parcels, today],
  )

  function clearFilters() {
    setFilters({ query: '', country: '', origin: '', destination: '', status: 'active' })
  }

  return (
    <div className="community-warm-bg grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        title={t('parcels.browse.title')}
        stats={[
          { label: t('parcels.browse.stats.availableTrips'), value: visibleParcels.length },
        ]}
        actions={
          <>
            <Button
              variant={showMine ? 'primary' : 'secondary'}
              icon={FiUser}
              onClick={() => setShowMine((v) => !v)}
            >
              {showMine ? t('parcels.browse.actions.allParcels') : t('parcels.browse.actions.myParcels')}
            </Button>
            <Button icon={FiPlus} onClick={() => navigate('/parcels/publish')}>
              {t('parcels.browse.actions.publish')}
            </Button>
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleParcels.length}
          showCount={false}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder={t('parcels.browse.search.placeholder')}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              id="parcel-filter-country"
              label={t('parcels.browse.filters.country')}
              value={filters.country}
              onChange={(event) =>
                setFilters((current) => ({ ...current, country: event.target.value }))
              }
            >
              {parcelCountryFilterOptions.map((option) => (
                <option key={option.value || 'default'} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
            <Input
              id="parcel-filter-origin"
              label={t('parcels.browse.filters.origin')}
              value={filters.origin}
              onChange={(event) =>
                setFilters((current) => ({ ...current, origin: event.target.value }))
              }
              placeholder={t('parcels.browse.filters.cityPlaceholder')}
            />
            <Input
              id="parcel-filter-destination"
              label={t('parcels.browse.filters.destination')}
              value={filters.destination}
              onChange={(event) =>
                setFilters((current) => ({ ...current, destination: event.target.value }))
              }
              placeholder={t('parcels.browse.filters.cityPlaceholder')}
            />
            <Select
              id="parcel-filter-status"
              label={t('parcels.browse.filters.status')}
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              {parcelStatusFilterOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>
        <CatalogArchiveTabs
          active={tab}
          onChange={setTab}
          tabs={parcelBrowseTabs.map((item) => ({
            key: item.key,
            label: t(item.labelKey),
            count: item.key === 'active' ? visibleParcels.length : archivedParcels.length,
          }))}
        />

        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tab === 'active' ? (
            visibleParcels.length ? (
              visibleParcels.map((parcel, index) => (
                <RevealListItem key={parcel.id} index={index} className="h-full overflow-visible">
                  <div className="relative h-full">
                    <Link to={`/parcels/${parcel.id}`} className="block h-full">
                      <Card
                        variant="interactive"
                        className="group relative h-full overflow-hidden !border-transparent p-4 hover:!border-transparent sm:p-5 dark:hover:!border-transparent"
                      >
                        <span className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1">
                          {(() => {
                            const proofStatus = resolveParcelProofStatus(parcel)
                            return (
                              <Badge tone={parcelProofTone(proofStatus)} className="!px-1.5 !py-0.5 !text-[9px]">
                                {t(parcelProofLabelKey(proofStatus))}
                              </Badge>
                            )
                          })()}
                          {parcel.businessId ? (
                            <VerifiedBadge size="sm" label={t('parcels.card.business')} />
                          ) : (
                            <span className="rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                              {t('parcels.card.individual')}
                            </span>
                          )}
                        </span>
                        <div className="mt-6 flex min-w-0 items-center gap-2 sm:mt-7">
                          <EntityVerifiedName
                            as="h2"
                            name={parcel.ownerName}
                            userId={parcel.ownerId}
                            businessId={parcel.businessId}
                            className="min-w-0 text-sm font-black sm:text-base"
                            nameClassName="truncate"
                          />
                        </div>
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                          <div className="min-w-0 flex-1 text-center">
                            <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                              {parcel.origin}
                            </p>
                          </div>
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
                            <FiArrowRight className="text-xs" />
                          </span>
                          <div className="min-w-0 flex-1 text-center">
                            <p className="truncate text-xs font-black uppercase tracking-wide text-[var(--app-text)]">
                              {parcel.destination}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <ParcelMetric
                            value={`${parcel.remainingKg} kg`}
                            label={t('parcels.card.available')}
                          />
                          <ParcelMetric
                            value={formatMoney(parcel.pricePerKg, parcel.currency)}
                            label={t('parcels.card.perKg')}
                          />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-[var(--app-text-muted)]">
                          <span className="flex items-center gap-2">
                            <FiCalendar /> {t('parcels.card.departure', { date: parcel.departureDate })}
                          </span>
                          <span className="flex items-center gap-2">
                            <FiCalendar />{' '}
                            {t('parcels.card.depositBefore', {
                              date: parcel.depositDeadline || parcel.departureDate,
                            })}
                          </span>
                          {parcel.distributionDate ? (
                            <span className="flex items-center gap-2">
                              <FiCalendar />{' '}
                              {t('parcels.card.pickupFrom', { date: parcel.distributionDate })}
                            </span>
                          ) : null}
                        </div>
                        <span className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-2 text-center text-xs font-black text-white transition group-hover:bg-brand-800 sm:min-h-11 sm:text-sm dark:bg-brand-600">
                          {t('parcels.card.viewDetail')} <FiArrowRight className="text-xs" />
                        </span>
                      </Card>
                    </Link>
                  </div>
                </RevealListItem>
              ))
            ) : (
              <EmptyState
                className="col-span-full"
                icon={FiPackage}
                tone="warm"
                title={t('parcels.empty.activeTitle')}
                description={t('parcels.empty.activeDescription')}
                action={
                  <Button icon={FiPlus} onClick={() => navigate('/parcels/publish')}>
                    {t('parcels.browse.actions.publish')}
                  </Button>
                }
              />
            )
          ) : (
            archivedParcels.length ? (
              archivedParcels.map((parcel, index) => (
                <RevealListItem key={parcel.id} index={index}>
                  <Link to={`/parcels/${parcel.id}`}>
                    <Card
                      variant="interactive"
                      className="group relative h-full overflow-hidden !border-transparent p-4 opacity-80 hover:!border-transparent sm:p-5 dark:hover:!border-transparent"
                    >
                      <span className="absolute right-2 top-2 z-10 rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                        {t('parcels.card.archived')}
                      </span>
                      <div className="mt-6 flex min-w-0 items-center gap-2 pr-10 sm:mt-7">
                        <EntityVerifiedName
                          as="h2"
                          name={parcel.ownerName}
                          userId={parcel.ownerId}
                          businessId={parcel.businessId}
                          className="min-w-0 text-sm font-black sm:text-base"
                          nameClassName="truncate"
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                        <p className="min-w-0 flex-1 truncate text-center text-xs font-black uppercase tracking-wide">{parcel.origin}</p>
                        <FiArrowRight className="shrink-0 text-xs text-[var(--app-text-muted)]" />
                        <p className="min-w-0 flex-1 truncate text-center text-xs font-black uppercase tracking-wide">{parcel.destination}</p>
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                        <FiCalendar /> {t('parcels.card.departure', { date: parcel.departureDate })}
                      </p>
                    </Card>
                  </Link>
                </RevealListItem>
              ))
            ) : (
              <EmptyState
                className="col-span-full"
                icon={FiPackage}
                tone="warm"
                title={t('parcels.empty.archivedTitle')}
                description={t('parcels.empty.archivedDescription')}
              />
            )
          )}
        </CatalogGrid>
      </ScrollSectionAnchor>
    </div>
  )
}

function ParcelMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3 sm:p-4">
      <strong className="block break-words text-sm tabular-nums leading-snug sm:text-base">
        {value}
      </strong>
      <span className="mt-1 block text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
