import { FiCalendar, FiMapPin, FiPlus, FiUser, FiUsers } from 'react-icons/fi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { EVENT_CATEGORIES } from '../config/options'
import { EventRegistrationsPanel } from '../features/events/EventRegistrationsPanel'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { sortByCountryPriority, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { resolveEventCountry } from '../features/marketplace/listingCatalogUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function EventsPage() {
  useScrollToSecondSection()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showMine, setShowMine] = useState(false)
  const [filters, setFilters] = useState({ query: '', city: '', category: '', price: '' })
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
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
      return sortByCountryPriority(filtered, preferredCountry, resolveEventCountry)
    },
    [events, filters, preferredCountry, showMine, user.id],
  )
  function clearFilters() {
    setFilters({ query: '', city: '', category: '', price: '' })
  }

  const scrollToRegistrations = useCallback(() => {
    document
      .getElementById('event-registrations')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (window.location.hash === '#inscriptions') scrollToRegistrations()
  }, [scrollToRegistrations])

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title="Événements"
        description="Rencontres, ateliers, formations et inscriptions."
        actions={
          <>
            {canManage ? (
              <>
                <Button
                  variant={showMine ? 'primary' : 'secondary'}
                  icon={FiUser}
                  onClick={() => setShowMine((v) => !v)}
                >
                  {showMine ? 'Tous les événements' : 'Mes événements'}
                </Button>
                <Button variant="secondary" icon={FiUsers} onClick={scrollToRegistrations}>
                  Inscriptions
                </Button>
              </>
            ) : null}
            <Button icon={FiPlus} onClick={() => navigate('/events/publish')}>
              Créer un événement
            </Button>
          </>
        }
      />
      {canManage ? <EventRegistrationsPanel /> : null}
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleEvents.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder="Événement, organisateur, lieu ou ville..."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="event-filter-city"
              label="Ville"
              value={filters.city}
              onChange={(event) =>
                setFilters((current) => ({ ...current, city: event.target.value }))
              }
            />
            <Select
              id="event-filter-category"
              label="Catégorie"
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({ ...current, category: event.target.value }))
              }
            >
              <option value="">Toutes</option>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
            <Select
              id="event-filter-price"
              label="Accès"
              value={filters.price}
              onChange={(event) =>
                setFilters((current) => ({ ...current, price: event.target.value }))
              }
            >
              <option value="">Tous</option>
              <option value="free">Gratuits</option>
              <option value="paid">Payants</option>
            </Select>
          </div>
        </CatalogSearch>
        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visibleEvents.length ? (
            visibleEvents.map((event, index) => (
              <RevealListItem key={event.id} index={index}>
                <Link to={`/events/${event.id}`}>
                  <Card className="h-full transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900">
                        <FiCalendar />
                      </span>
                      <Badge>{event.category}</Badge>
                    </div>
                    <h2 className="mt-4 font-black">{event.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {event.businessId ? 'Entreprise' : 'Particulier'} · {event.organizerName}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <span>{formatDate(event.startAt)}</span>
                      <span className="flex items-center gap-2">
                        <FiMapPin className="text-brand-700" />
                        {event.venue}, {event.city}
                      </span>
                      <strong className="text-brand-700">
                        {event.price ? formatMoney(event.price, event.currency) : 'Gratuit'}
                      </strong>
                    </div>
                  </Card>
                </Link>
              </RevealListItem>
            ))
          ) : (
            <Card className="grid place-items-center gap-4 border-dashed py-10 text-center text-sm text-slate-500">
              Aucun événement publié.
              <Button icon={FiPlus} onClick={() => navigate('/events/publish')}>
                Créer un événement
              </Button>
            </Card>
          )}
        </CatalogGrid>
      </ScrollSectionAnchor>
    </div>
  )
}
