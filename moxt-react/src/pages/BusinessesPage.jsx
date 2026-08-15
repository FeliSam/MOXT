import { FiBriefcase, FiMapPin, FiPhone, FiPlus, FiX } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge, PillBadge, VerifiedDisplayName } from '../components/ui/Badge'
import { BusinessRatingBadge } from '../features/reviews/BusinessRatingBadge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LinkifiedText } from '../components/ui/LinkifiedText'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { activityByValue } from '../config/businessActivities'
import { flagEmoji } from '../config/flags'
import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from '../config/geography'
import { Alert } from '../components/ui/Alert'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { isBusinessDirectoryVisible } from '../features/businesses/businessPublishUtils'
import {
  businessesOptionLabel,
  businessesServiceLabel,
  businessesText,
} from '../features/businesses/businessesI18n'
import { BusinessVerificationProgress } from '../features/businesses/BusinessVerificationProgress'
import { filterDirectoryBusinesses, selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

const DIRECTORY_SERVICES = ['Transfert', 'Colis', 'Marketplace', 'Jobs', 'Events']

const COUNTRY_NAME_BY_CODE = Object.fromEntries(
  [...FALLBACK_AFRICAN_COUNTRIES, RUSSIA].map((country) => [country.code, country.name]),
)

function businessCountryCode(business) {
  return String(business.originCountry || business.country || '')
    .trim()
    .toUpperCase()
}

function countryDisplayName(code) {
  if (!code) return ''
  return COUNTRY_NAME_BY_CODE[code] || code
}

const EMPTY_FILTERS = {
  query: '',
  city: '',
  sector: '',
  service: '',
  country: '',
}

export function BusinessesPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const ownBusiness = selectActiveBusinessForOwner(businesses, user?.id)
  const ownBusinessDocuments = useSelector((state) =>
    ownBusiness
      ? state.businesses.documents.filter((item) => item.businessId === ownBusiness.id)
      : [],
  )
  const ownBusinessInDirectory = ownBusiness && isBusinessDirectoryVisible(ownBusiness)

  const directoryPool = useMemo(
    () =>
      filterDirectoryBusinesses(businesses).filter((business) => {
        if (!isBusinessDirectoryVisible(business, user)) return false
        if (ownBusiness && business.id === ownBusiness.id) return false
        return true
      }),
    [businesses, ownBusiness, user],
  )

  const countryOptions = useMemo(() => {
    const codes = new Set()
    for (const business of directoryPool) {
      const code = businessCountryCode(business)
      if (code) codes.add(code)
    }
    return [...codes].sort((a, b) =>
      countryDisplayName(a).localeCompare(countryDisplayName(b), 'fr'),
    )
  }, [directoryPool])

  const cityOptions = useMemo(() => {
    const cities = new Set()
    for (const business of directoryPool) {
      if (filters.country && businessCountryCode(business) !== filters.country) continue
      const city = String(business.city || '').trim()
      if (city) cities.add(city)
    }
    return [...cities].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [directoryPool, filters.country])

  const sectorOptions = useMemo(() => {
    const values = new Set()
    for (const business of directoryPool) {
      if (business.primaryActivity) values.add(business.primaryActivity)
    }
    return [...values]
      .map((value) => activityByValue(value))
      .filter(Boolean)
      .sort((a, b) =>
        businessesOptionLabel(t, a).localeCompare(businessesOptionLabel(t, b), 'fr'),
      )
  }, [directoryPool, t])

  const visibleBusinesses = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    return directoryPool
      .filter((business) => {
        if (filters.service && !business.services?.includes(filters.service)) return false
        if (filters.country && businessCountryCode(business) !== filters.country) return false
        if (filters.city && business.city !== filters.city) return false
        if (filters.sector && business.primaryActivity !== filters.sector) return false
        if (!query) return true
        const activity = activityByValue(business.primaryActivity)
        const activityLabel = businessesOptionLabel(t, activity) || business.sector || ''
        const haystack =
          `${business.name} ${activityLabel} ${business.city} ${business.description} ${business.services?.join(' ')}`.toLowerCase()
        return haystack.includes(query)
      })
      .sort((left, right) => {
        const pinDelta = Number(Boolean(right.pinnedAt)) - Number(Boolean(left.pinnedAt))
        if (pinDelta !== 0) return pinDelta
        if (left.pinnedAt && right.pinnedAt) {
          return String(right.pinnedAt).localeCompare(String(left.pinnedAt))
        }
        return 0
      })
  }, [directoryPool, filters, t])

  const activeAdvancedFilters = useMemo(() => {
    const items = []
    if (filters.country) {
      items.push({
        key: 'country',
        label: `${flagEmoji(filters.country)} ${countryDisplayName(filters.country)}`,
      })
    }
    if (filters.city) {
      items.push({ key: 'city', label: filters.city })
    }
    if (filters.sector) {
      const activity = activityByValue(filters.sector)
      items.push({
        key: 'sector',
        label: businessesOptionLabel(t, activity) || filters.sector,
      })
    }
    return items
  }, [filters.city, filters.country, filters.sector, t])

  const activeFilterCount = activeAdvancedFilters.length

  function setFilter(patch) {
    setFilters((current) => {
      const next = { ...current, ...patch }
      if (Object.prototype.hasOwnProperty.call(patch, 'country') && patch.country !== current.country) {
        next.city = ''
      }
      return next
    })
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  function clearAdvancedFilter(key) {
    if (key === 'country') setFilter({ country: '', city: '' })
    else setFilter({ [key]: '' })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={bt('businesses.page.title')}
        stats={[{ label: bt('businesses.page.stats.verified'), value: visibleBusinesses.length }]}
        actions={
          <HeaderIslandButton
            icon={FiPlus}
            to="/businesses/setup"
            label={ownBusiness ? bt('businesses.page.editBusiness') : bt('businesses.page.createBusiness')}
          />
        }
      />

      {ownBusiness && !ownBusinessInDirectory ? (
        <Alert variant="warning" title={bt('businesses.page.pendingAlertTitle')}>
          <strong>{ownBusiness.name}</strong> {bt('businesses.page.pendingAlertBody')}{' '}
          <Link className="font-bold underline" to="/professional">
            {bt('businesses.page.professionalSpaceLink')}
          </Link>
          .
        </Alert>
      ) : null}

      {ownBusiness ? (
        <Card variant="featured" className="grid gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-700">
                {bt('businesses.page.yourBusiness')}
              </p>
              <h2 className="mt-1 text-xl font-black">{ownBusiness.name}</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {businessesOptionLabel(t, activityByValue(ownBusiness.primaryActivity)) ||
                  ownBusiness.sector}{' '}
                · {ownBusiness.city}
              </p>
            </div>
            <Badge tone={statusMeta(ownBusiness.status, t).tone}>
              {statusMeta(ownBusiness.status, t).label}
            </Badge>
          </div>
          <BusinessVerificationProgress
            business={ownBusiness}
            documents={ownBusinessDocuments}
            compact={ownBusinessInDirectory}
          />
          <div className="flex flex-wrap gap-2">
            <Link to="/professional">
              <Button variant="secondary">{bt('businesses.page.professionalSpace')}</Button>
            </Link>
            <Link to="/businesses/setup">
              <Button variant="secondary">{bt('businesses.common.edit')}</Button>
            </Link>
            {ownBusinessInDirectory ? (
              <Link to={`/businesses/${ownBusiness.id}`}>
                <Button>{bt('businesses.page.viewPublicProfile')}</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <div className="scrollbar-hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <PillBadge
            active={!filters.service}
            onClick={() => setFilter({ service: '' })}
            className="shrink-0"
          >
            {bt('businesses.page.filter.allServices')}
          </PillBadge>
          {DIRECTORY_SERVICES.map((service) => (
            <PillBadge
              key={service}
              active={filters.service === service}
              onClick={() => setFilter({ service })}
              className="shrink-0"
            >
              {businessesServiceLabel(t, service)}
            </PillBadge>
          ))}
        </div>

        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleBusinesses.length}
          activeFilterCount={activeFilterCount}
          query={filters.query}
          onQueryChange={(query) => setFilter({ query })}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder={bt('businesses.page.searchPlaceholder')}
        >
          <div className="grid gap-5">
            <section className="grid gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                  {bt('businesses.page.filter.sectionLocation')}
                </p>
                <p className="mt-0.5 text-xs text-[var(--app-text-faint)]">
                  {bt('businesses.page.filter.sectionLocationHint')}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  id="business-filter-country"
                  label={bt('businesses.page.filter.country')}
                  value={filters.country}
                  onChange={(event) => setFilter({ country: event.target.value })}
                >
                  <option value="">{bt('businesses.page.filter.allCountries')}</option>
                  {countryOptions.map((code) => (
                    <option key={code} value={code}>
                      {flagEmoji(code)} {countryDisplayName(code)}
                    </option>
                  ))}
                </Select>
                <Select
                  id="business-filter-city"
                  label={bt('businesses.common.city')}
                  value={filters.city}
                  disabled={!filters.country}
                  onChange={(event) => setFilter({ city: event.target.value })}
                >
                  <option value="">
                    {filters.country
                      ? bt('businesses.page.filter.allCities')
                      : bt('businesses.page.filter.chooseCountryFirst')}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </div>
            </section>

            <section className="grid gap-3 border-t border-[var(--app-border)] pt-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                  {bt('businesses.page.filter.sectionDomain')}
                </p>
                <p className="mt-0.5 text-xs text-[var(--app-text-faint)]">
                  {bt('businesses.page.filter.sectionDomainHint')}
                </p>
              </div>
              <Select
                id="business-filter-sector"
                label={bt('businesses.page.filter.domain')}
                value={filters.sector}
                onChange={(event) => setFilter({ sector: event.target.value })}
              >
                <option value="">{bt('businesses.page.filter.allDomains')}</option>
                {sectorOptions.map((activity) => (
                  <option key={activity.value} value={activity.value}>
                    {businessesOptionLabel(t, activity)}
                  </option>
                ))}
              </Select>
            </section>
          </div>
        </CatalogSearch>

        {!advancedOpen && activeAdvancedFilters.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeAdvancedFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => clearAdvancedFilter(item.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text)] shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                aria-label={bt('businesses.page.filter.removeFilter', { label: item.label })}
              >
                {item.label}
                <FiX className="text-[var(--app-text-faint)]" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter({ country: '', city: '', sector: '' })}
              className="text-xs font-black text-brand-700 transition hover:text-brand-800 dark:text-brand-300"
            >
              {bt('businesses.page.filter.clearAdvanced')}
            </button>
          </div>
        ) : null}

        <div>
          <h2 className="text-xl font-black">{bt('businesses.page.directoryTitle')}</h2>
        </div>

        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBusinesses.length ? (
            visibleBusinesses.map((business, index) => {
              const activity = activityByValue(business.primaryActivity)
              const Icon = activity?.icon || FiBriefcase
              return (
                <RevealListItem key={business.id} index={index}>
                  <Card
                    variant="verified"
                    className="flex h-full flex-col overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={business.logoUrl || '/assets/services/service-businesses.svg'}
                        alt=""
                        className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--app-border)] sm:size-16"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="min-w-0 flex-1">
                        <VerifiedDisplayName
                          as="h3"
                          name={business.name}
                          verified
                          iconSize="sm"
                          className="break-words text-sm font-black sm:text-base"
                        />
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--app-text-faint)]">
                          <Icon className="shrink-0 text-sm text-brand-700 dark:text-brand-300" />
                          {businessesOptionLabel(t, activity) || business.sector}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={statusMeta(business.status, t).tone}>
                        {statusMeta(business.status, t).label}
                      </Badge>
                      <BusinessRatingBadge business={business} />
                    </div>

                    <LinkifiedText
                      as="p"
                      text={business.description}
                      preserveWhitespace="pre-line"
                      className="mt-3 max-sm:hidden line-clamp-5 min-h-[7.5rem] text-sm leading-6 text-[var(--app-text-muted)]"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(business.services || []).slice(0, 3).map((service) => (
                        <Badge key={service} tone="teal">
                          {businessesServiceLabel(t, service)}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-2 border-t border-[var(--app-border)] pt-4 text-xs text-[var(--app-text-muted)] sm:grid-cols-2 sm:text-sm">
                      <span className="hidden items-center gap-2 sm:flex">
                        <FiMapPin /> {business.city}
                      </span>
                      <span className="flex items-center gap-2">
                        <FiPhone /> {business.phone}
                      </span>
                    </div>
                    <Link
                      className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-black text-brand-700 transition hover:gap-2.5 sm:text-sm dark:text-brand-300"
                      to={`/businesses/${business.id}`}
                    >
                      {bt('businesses.page.viewBusinessCard')}
                    </Link>
                  </Card>
                </RevealListItem>
              )
            })
          ) : (
            <EmptyState
              className="col-span-full"
              icon={FiBriefcase}
              title={bt('businesses.page.emptyTitle')}
              description={bt('businesses.page.emptyDescription')}
            />
          )}
        </CatalogGrid>
      </ScrollSectionAnchor>
    </div>
  )
}
