import { FiBriefcase, FiMapPin, FiPhone, FiPlus } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { BUSINESS_ACTIVITIES, activityByValue } from '../config/businessActivities'
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

export function BusinessesPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filters, setFilters] = useState({ query: '', city: '', sector: '', service: '' })
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const ownBusiness = selectActiveBusinessForOwner(businesses, user?.id)
  const ownBusinessDocuments = useSelector((state) =>
    ownBusiness
      ? state.businesses.documents.filter((item) => item.businessId === ownBusiness.id)
      : [],
  )
  const ownBusinessInDirectory = ownBusiness && isBusinessDirectoryVisible(ownBusiness)

  const visibleBusinesses = useMemo(
    () =>
      filterDirectoryBusinesses(businesses).filter((business) => {
        if (!isBusinessDirectoryVisible(business, user)) return false
        if (ownBusiness && business.id === ownBusiness.id) return false
        const activity = activityByValue(business.primaryActivity)
        const activityLabel = businessesOptionLabel(t, activity) || business.sector
        const haystack =
          `${business.name} ${activityLabel} ${business.city} ${business.description} ${business.services?.join(' ')}`.toLowerCase()
        return (
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.city || business.city.toLowerCase().includes(filters.city.toLowerCase())) &&
          (!filters.sector || business.primaryActivity === filters.sector) &&
          (!filters.service || business.services?.includes(filters.service))
        )
      }),
    [businesses, filters, ownBusiness, t, user],
  )

  function clearFilters() {
    setFilters({ query: '', city: '', sector: '', service: '' })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={bt('businesses.page.eyebrow')}
        title={bt('businesses.page.title')}
        description={bt('businesses.page.description')}
        stats={[{ label: bt('businesses.page.stats.verified'), value: visibleBusinesses.length }]}
        actions={
          <Link to="/businesses/setup">
            <Button icon={FiPlus}>
              {ownBusiness ? bt('businesses.page.editBusiness') : bt('businesses.page.createBusiness')}
            </Button>
          </Link>
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
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleBusinesses.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder={bt('businesses.page.searchPlaceholder')}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="business-filter-city"
              label={bt('businesses.common.city')}
              value={filters.city}
              onChange={(event) =>
                setFilters((current) => ({ ...current, city: event.target.value }))
              }
            />
            <Select
              id="business-filter-sector"
              label={bt('businesses.page.filter.domain')}
              value={filters.sector}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sector: event.target.value }))
              }
            >
              <option value="">{bt('businesses.page.filter.allDomains')}</option>
              {BUSINESS_ACTIVITIES.map((activity) => (
                <option key={activity.value} value={activity.value}>
                  {businessesOptionLabel(t, activity)}
                </option>
              ))}
            </Select>
            <Select
              id="business-filter-service"
              label={bt('businesses.common.service')}
              value={filters.service}
              onChange={(event) =>
                setFilters((current) => ({ ...current, service: event.target.value }))
              }
            >
              <option value="">{bt('businesses.page.filter.allServices')}</option>
              {DIRECTORY_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {businessesServiceLabel(t, service)}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>

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
                    </div>

                    <p className="mt-3 hidden text-sm leading-6 text-[var(--app-text-muted)] sm:block">
                      {business.description}
                    </p>
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
