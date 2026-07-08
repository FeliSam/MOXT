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
import { VerifiedBadge } from '../components/ui/Badge'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { sortByCountryPriority, resolveUserCountryCode } from '@moxt/shared/utils/countryPriority.js'
import { sortBySubscriptionPriority } from '@moxt/shared/utils/subscriptionUtils.js'
import { resolveParcelCountry } from '../features/marketplace/listingCatalogUtils'
import { formatMoney } from '../features/transfers/transferUtils'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'

export function ParcelsPage() {
  useScrollToSecondSection()
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
  const activeCountryCode = filters.country === 'ALL' ? null : filters.country || userCountry
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
        eyebrow="Transport"
        title="Colis et voyages"
        description="Publiez une capacité de transport ou réservez une place disponible."
        stats={[
          { label: 'Trajets disponibles', value: visibleParcels.length },
        ]}
        actions={
          <>
            <Button
              variant={showMine ? 'primary' : 'secondary'}
              icon={FiUser}
              onClick={() => setShowMine((v) => !v)}
            >
              {showMine ? 'Tous les colis' : 'Mes colis'}
            </Button>
            <Button icon={FiPlus} onClick={() => navigate('/parcels/publish')}>
              Publier un voyage
            </Button>
          </>
        }
      />
      <ScrollSectionAnchor className="scroll-mt-24 grid gap-5 lg:scroll-mt-28">
        <CatalogSearch
          advancedOpen={advancedOpen}
          count={visibleParcels.length}
          query={filters.query}
          onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={clearFilters}
          placeholder="Pays, ville, voyageur, entreprise..."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              id="parcel-filter-country"
              label="Pays"
              value={filters.country}
              onChange={(event) =>
                setFilters((current) => ({ ...current, country: event.target.value }))
              }
            >
              <option value="">Mon pays par defaut</option>
              <option value="ALL">Tous les pays</option>
              <option value="RU">Russie</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
            <Input
              id="parcel-filter-origin"
              label="Départ"
              value={filters.origin}
              onChange={(event) =>
                setFilters((current) => ({ ...current, origin: event.target.value }))
              }
              placeholder="Ville ou pays"
            />
            <Input
              id="parcel-filter-destination"
              label="Destination"
              value={filters.destination}
              onChange={(event) =>
                setFilters((current) => ({ ...current, destination: event.target.value }))
              }
              placeholder="Ville ou pays"
            />
            <Select
              id="parcel-filter-status"
              label="Statut"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="">Tous</option>
              <option value="active">Disponibles</option>
              <option value="full">Complets</option>
            </Select>
          </div>
        </CatalogSearch>
        <CatalogArchiveTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'active', label: 'Voyages actifs', count: visibleParcels.length },
            { key: 'archived', label: 'Archives', count: archivedParcels.length },
          ]}
        />

        <CatalogGrid lazy={false} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tab === 'active' ? (
            visibleParcels.length ? (
              visibleParcels.map((parcel, index) => (
                <RevealListItem key={parcel.id} index={index}>
                  <Link to={`/parcels/${parcel.id}`}>
                    <Card variant="interactive" className="group relative h-full overflow-hidden p-4 sm:p-5">
                      <span className="absolute right-2 top-2 z-10 flex items-center gap-1">
                        {parcel.proofStatus === 'verified' ? (
                          <VerifiedBadge size="sm" label="Preuve vérifiée" />
                        ) : null}
                        {parcel.businessId ? (
                          <VerifiedBadge size="sm" label="Entreprise" />
                        ) : (
                          <span className="rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                            Particulier
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-black sm:text-base">
                          {parcel.ownerName}
                        </h2>
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
                        <ParcelMetric value={`${parcel.remainingKg} kg`} label="Disponible" />
                        <ParcelMetric
                          value={formatMoney(parcel.pricePerKg, parcel.currency)}
                          label="Par kg"
                        />
                      </div>
                      <div className="mt-4 hidden gap-2 text-sm text-[var(--app-text-muted)] sm:grid">
                        <span className="flex items-center gap-2">
                          <FiCalendar /> Départ {parcel.departureDate}
                        </span>
                        <span className="flex items-center gap-2">
                          <FiCalendar /> Dépôt avant {parcel.depositDeadline || parcel.departureDate}
                        </span>
                      </div>
                      <span className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-2 text-center text-xs font-black text-white transition group-hover:bg-brand-800 sm:min-h-11 sm:text-sm dark:bg-brand-600">
                        Voir le détail <FiArrowRight className="text-xs" />
                      </span>
                    </Card>
                  </Link>
                </RevealListItem>
              ))
            ) : (
              <EmptyState
                className="col-span-full"
                icon={FiPackage}
                tone="warm"
                title="Aucun voyage publié"
                description="Soyez le premier a proposer un trajet ou ajustez vos filtres."
                action={
                  <Button icon={FiPlus} onClick={() => navigate('/parcels/publish')}>
                    Publier un voyage
                  </Button>
                }
              />
            )
          ) : (
            archivedParcels.length ? (
              archivedParcels.map((parcel, index) => (
                <RevealListItem key={parcel.id} index={index}>
                  <Link to={`/parcels/${parcel.id}`}>
                    <Card variant="interactive" className="group relative h-full overflow-hidden p-4 sm:p-5 opacity-80">
                      <span className="absolute right-2 top-2 z-10 rounded-full bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-text-faint)]">
                        Archivé
                      </span>
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-black sm:text-base">{parcel.ownerName}</h2>
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                        <p className="min-w-0 flex-1 truncate text-center text-xs font-black uppercase tracking-wide">{parcel.origin}</p>
                        <FiArrowRight className="shrink-0 text-xs text-[var(--app-text-muted)]" />
                        <p className="min-w-0 flex-1 truncate text-center text-xs font-black uppercase tracking-wide">{parcel.destination}</p>
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                        <FiCalendar /> Départ {parcel.departureDate}
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
                title="Aucune archive"
                description="Les voyages passés ou terminés apparaîtront ici."
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
