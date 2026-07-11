import { FiArrowLeft, FiBriefcase } from 'react-icons/fi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import { activityByValue } from '../config/businessActivities'
import { selectBusinessById } from '../features/businesses/businessSelectors'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyParcelPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  buildUserPublicationProfile,
  collectBusinessPublications,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTypeCounts,
  visiblePublicationCount,
} from '../features/publications/publicationCatalogUtils'
import { PublicationProfileCard } from '../features/publications/PublicationProfileCard'

const CONTENT_TYPE_MAP = {
  listings: 'listing',
  jobs: 'job',
  events: 'event',
  parcels: 'parcel',
}

const BUSINESS_TYPE_TABS = PUBLICATION_TYPE_TABS.filter((tab) => tab.id !== 'post')

export function BusinessPublicationsPage() {
  const { businessId, contentType } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const appState = useSelector((state) => state)
  const business = useSelector((state) => selectBusinessById(state, businessId))

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const defaultType = CONTENT_TYPE_MAP[contentType] || 'listing'
  const typeTab = BUSINESS_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : BUSINESS_TYPE_TABS.some((tab) => tab.id === defaultType)
      ? defaultType
      : 'listing'

  const publications = useMemo(
    () => collectBusinessPublications(appState, businessId),
    [appState, businessId],
  )
  const profile = useMemo(
    () =>
      buildUserPublicationProfile(businessId, publications, {
        displayName: business?.name || 'Entreprise',
      }),
    [business?.name, businessId, publications],
  )
  const archiveCounts = useMemo(() => publicationArchiveCounts(publications), [publications])
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab),
    [archiveTab, publications],
  )
  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab, typeTab }),
    [archiveTab, publications, typeTab],
  )
  const hasContent = visiblePublicationCount(visible) > 0
  const activity = activityByValue(business?.primaryActivity)

  function setArchiveTab(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'active') params.delete('status')
    else params.set('status', 'archived')
    setSearchParams(params, { replace: true })
  }

  function setTypeTab(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'listing') params.delete('type')
    else params.set('type', next)
    setSearchParams(params, { replace: true })
  }

  if (!business) {
    return <EmptyState title="Entreprise introuvable" />
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Publications entreprise"
        title={business.name}
        description={`${activity?.label || business.sector} · ${business.city} — contenus publiés au nom de l’entreprise uniquement.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to={`/businesses/${business.id}`}>
              <Button variant="secondary" icon={FiArrowLeft}>
                Fiche entreprise
              </Button>
            </Link>
            <Link to="/businesses">
              <Button variant="secondary" icon={FiBriefcase}>
                Annuaire
              </Button>
            </Link>
          </div>
        }
      />

      <PublicationProfileCard
        displayName={business.name}
        verified={['verified', 'approved', 'active'].includes(business.status)}
        city={business.city}
        country={business.country}
        activeCount={profile.activeCount}
        archivedCount={profile.archivedCount}
        totalCount={profile.totalCount}
        totalViews={profile.totalViews}
        scope="business"
        ownBusiness={business}
      />

      <div className="grid gap-4">
        <CatalogArchiveTabs
          active={archiveTab}
          onChange={setArchiveTab}
          variant="filter"
          tabs={[
            { key: 'active', label: 'Actives', count: archiveCounts.active },
            { key: 'archived', label: 'Archives', count: archiveCounts.archived },
          ]}
        />

        <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1">
          {BUSINESS_TYPE_TABS.map((tab) => (
            <PillBadge
              key={tab.id}
              active={typeTab === tab.id}
              onClick={() => setTypeTab(tab.id)}
              className="shrink-0 whitespace-nowrap"
            >
              {tab.label} ({typeCounts[tab.id]})
            </PillBadge>
          ))}
        </div>
      </div>

      {hasContent ? (
        <div className="grid gap-4">
          {visible.listing.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} ownerMode={false} showViews />
          ))}
          {visible.parcel.map((parcel) => (
            <MyParcelPublicationCard key={parcel.id} parcel={parcel} readOnly />
          ))}
          {visible.job.map((job) => (
            <MyJobPublicationCard key={job.id} job={job} readOnly />
          ))}
          {visible.event.map((event) => (
            <MyEventPublicationCard key={event.id} event={event} readOnly />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune publication entreprise"
          description="Les annonces publiées au nom de cette entreprise apparaîtront ici."
        />
      )}
    </div>
  )
}
