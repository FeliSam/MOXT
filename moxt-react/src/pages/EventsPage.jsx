import { FiCalendar, FiMapPin, FiPlus, FiUser } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { CatalogFavoriteButton } from '../features/account/CatalogFavoriteButton'
import { useLanguage } from '../contexts/useLanguage'
import {
  EVENT_CATEGORY_OPTIONS,
  EVENT_PRICE_FILTER_OPTIONS,
  eventPublisherTypeKey,
} from '../features/events/eventsConfig'
import { resolveEventCountry } from '../features/marketplace/listingCatalogUtils'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { sortByCountryPriority, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { sortBySubscriptionPriority } from '@moxt/shared/utils/subscriptionUtils.js'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function EventsPage() {
  useScrollToSecondSection()
  const { t } = useLanguage()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showMine, setShowMine] = useState(false)
  const [filters, setFilters] = useState({ query: '', city: '', category: '', price: '' })
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const subscriptions = useSelector((state) => state.account.subscriptions || [])
  const canManage = !!user
  const events = useSelector((state) => state.events.items)
  const preferredCountry = resolveUserCountryCode(user)
  const visibleEvents = useMemo(
    () => {
      const filtered = events.filter((event) => {
        if (showMine && (event.ownerId !== user.id || event.businessId)) return false
        const haystack =
          `${event.title} ${event.organizerName} ${event.category} ${event.city} ${event.venue}`.toLowerCase()
        return (
          (showMine || event.status === 'published') &&
          (!filters.query || haystack.includes(filters.query.toLowerCase())) &&
          (!filters.city || event.city.toLowerCase().includes(filters.city.toLowerCase())) &&
          (!filters.category || event.category === filters.category) &&
          (!filters.price ||
            (filters.price === 'free' ? Number(event.price) === 0 : Number(event.price) > 0))
        )
      })
      return sortBySubscriptionPriority(
        sortByCountryPriority(filtered, preferredCountry, resolveEventCountry),
        subscriptions,
        user?.id,
        'event',
      )
    },
    [events, filters, preferredCountry, showMine, subscriptions, user?.id, user.id],
  )
  function clearFilters() {
    setFilters({ query: '', city: '', category: '', price: '' })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('events.browse.eyebrow')}
        title={t('events.browse.title')}
        description={t('events.browse.description')}
        actions={
          <>
            {canManage ? (
              <Button
                variant={showMine ? 'primary' : 'secondary'}
                icon={FiUser}
                onClick={() => setShowMine((v) => !v)}
              >
                {showMine ? t('events.browse.showAll') : t('events.browse.showMine')}
              </Button>
            ) : null}
            <Button icon={FiPlus} onClick={() => navigate('/events/publish')}>
              {t('events.browse.create')}
            </Button>
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleEvents.length}
          showCount={false}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          label={t('events.browse.searchLabel')}
          placeholder={t('events.browse.searchPlaceholder')}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="event-filter-city"
              label={t('events.browse.city')}
              value={filters.city}
              onChange={(event) =>
                setFilters((current) => ({ ...current, city: event.target.value }))
              }
            />
            <Select
              id="event-filter-category"
              label={t('events.browse.category')}
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({ ...current, category: event.target.value }))
              }
            >
              <option value="">{t('events.browse.allCategories')}</option>
              {EVENT_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {t(category.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              id="event-filter-price"
              label={t('events.browse.access')}
              value={filters.price}
              onChange={(event) =>
                setFilters((current) => ({ ...current, price: event.target.value }))
              }
            >
              {EVENT_PRICE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
        </CatalogSearch>
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visibleEvents.length ? (
            visibleEvents.map((event, index) => {
              const coverImage = event.images?.[0]
              return (
              <RevealListItem key={event.id} index={index} className="h-full overflow-visible">
                <div className="relative h-full">
                  <Link to={`/events/${event.id}`} className="block h-full">
                    <Card className="relative h-full overflow-hidden !border-transparent transition hover:-translate-y-1 hover:shadow-xl">
                      {coverImage ? (
                        <div className="-mx-5 -mt-5 mb-4 aspect-[16/10] overflow-hidden sm:-mx-6 sm:-mt-6">
                          <img
                            src={coverImage}
                            alt={event.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-3 pr-10">
                        <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900">
                          <FiCalendar />
                        </span>
                        <Badge>{event.category}</Badge>
                      </div>
                      <h2 className="mt-4 font-black">{event.title}</h2>
                      <p className="mt-2 flex min-w-0 flex-wrap items-center gap-1 text-sm text-slate-500">
                        <span>{t(eventPublisherTypeKey(event.businessId))} ·</span>
                        <EntityVerifiedName
                          name={event.organizerName}
                          userId={event.ownerId}
                          businessId={event.businessId}
                          className="min-w-0"
                          nameClassName="truncate"
                        />
                      </p>
                      <div className="mt-3 grid gap-2 text-sm">
                        <span>{formatDate(event.startAt)}</span>
                        <span className="flex items-center gap-2">
                          <FiMapPin className="text-brand-700" />
                          {event.venue}, {event.city}
                        </span>
                        <strong className="text-brand-700">
                          {event.price
                            ? formatMoney(event.price, event.currency)
                            : t('events.browse.freePrice')}
                        </strong>
                      </div>
                    </Card>
                  </Link>
                  <CatalogFavoriteButton
                    relatedId={event.id}
                    relatedType="event"
                    title={event.title}
                    path={`/events/${event.id}`}
                    entity={event}
                  />
                </div>
              </RevealListItem>
              )
            })
          ) : (
            <Card className="grid place-items-center gap-4 border-dashed py-10 text-center text-sm text-slate-500">
              {t('events.browse.empty')}
              <Button icon={FiPlus} onClick={() => navigate('/events/publish')}>
                {t('events.browse.create')}
              </Button>
            </Card>
          )}
        </CatalogGrid>
      </ScrollSectionAnchor>
    </div>
  )
}
