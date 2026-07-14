import { FiArrowLeft, FiLock } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import { activityByValue } from '../config/businessActivities'
import { selectBusinessById } from '../features/businesses/businessSelectors'
import { canViewBusinessActivity } from '../features/account/activityVisibility'
import { useBusinessActivityVisibility } from '../features/businesses/useBusinessActivityVisibility'
import { ContactButton } from '../features/communications/ContactButton'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyParcelPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  buildBusinessPublicationProfile,
  collectBusinessPublications,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTypeCounts,
  visiblePublicationCount,
} from '../features/publications/publicationCatalogUtils'
import { PublicationProfileCard } from '../features/publications/PublicationProfileCard'
import { useRefreshPublicationsData } from '../features/publications/useRefreshPublicationsData'
import { selectBusinessReviewsBundle } from '../features/reviews/reviewSelectors'
import { businessCityLabel } from '../features/share/businessShareUtils'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestBusinessPreview } from '../features/guest/useGuestPreview'
import { calculateAggregateRating } from '@moxt/shared/utils/reviewUtils.js'

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
  const { guestMode = false } = useOutletContext() || {}
  const { requireAccount } = useGuestAction()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const reduxBusiness = useSelector((state) => selectBusinessById(state, businessId))
  const guestPreview = useGuestBusinessPreview(guestMode ? businessId : null)
  const business = guestMode ? guestPreview.business : reduxBusiness
  const marketplaceItems = useSelector((state) => state.marketplace.items)
  const parcelItems = useSelector((state) => state.parcels.items)
  const jobItems = useSelector((state) => state.jobs.items)
  const eventItems = useSelector((state) => state.events.items)
  const offerItems = useSelector((state) => state.p2p.offers)

  useRefreshPublicationsData(guestMode ? null : businessId)

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const defaultType = CONTENT_TYPE_MAP[contentType] || 'listing'
  const typeTab = BUSINESS_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : BUSINESS_TYPE_TABS.some((tab) => tab.id === defaultType)
      ? defaultType
      : 'listing'

  const publications = useMemo(() => {
    if (guestMode) {
      return (
        guestPreview.publications || {
          listings: [],
          parcels: [],
          jobs: [],
          events: [],
          posts: [],
          others: [],
        }
      )
    }
    return collectBusinessPublications(
      {
        marketplace: { items: marketplaceItems },
        parcels: { items: parcelItems },
        jobs: { items: jobItems },
        events: { items: eventItems },
        p2p: { offers: offerItems },
      },
      businessId,
    )
  }, [
    businessId,
    eventItems,
    guestMode,
    guestPreview.publications,
    jobItems,
    marketplaceItems,
    offerItems,
    parcelItems,
  ])
  const profile = useMemo(
    () => buildBusinessPublicationProfile(business, publications),
    [business, publications],
  )
  const reduxRating = useSelector((state) => selectBusinessReviewsBundle(state, business))
  const rating = guestMode
    ? calculateAggregateRating(guestPreview.reviews || [])
    : reduxRating.rating
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
  const sectorLabel = activity?.label || business?.sector || ''
  const isOwner = !guestMode && Boolean(business && user?.id && business.ownerId === user.id)
  const { visibility, loading: visibilityLoading } = useBusinessActivityVisibility(
    business,
    user?.id,
  )
  const canView = guestMode
    ? !guestPreview.loading && !guestPreview.error && guestPreview.business
    : canViewBusinessActivity({
        viewerId: user?.id,
        business: { ...business, activityVisibility: visibility },
        conversations,
      })
  const locationLabel = business ? businessCityLabel(business) : ''
  const handleGuestInteract = () => requireAccount('consulter cette publication')

  if (guestMode && guestPreview.loading) {
    return <EmptyState title="Chargement de l'aperçu" description="Récupération des publications de l'entreprise..." />
  }

  if (guestMode && guestPreview.error === 'not_found') {
    return (
      <EmptyState
        title="Entreprise introuvable"
        description="Cette entreprise n'existe pas ou n'est pas encore validée sur MOXT."
        action={
          <Link to="/discover">
            <Button variant="secondary" icon={FiArrowLeft}>
              Découvrir MOXT
            </Button>
          </Link>
        }
      />
    )
  }

  if (guestMode && (guestPreview.error === 'private' || guestPreview.error === 'contacts')) {
    return (
      <EmptyState
        icon={FiLock}
        title="Entreprise non accessible"
        description="Créez un compte MOXT pour demander l'accès ou découvrir d'autres entreprises."
        action={
          <Link to="/register">
            <Button>Créer un compte</Button>
          </Link>
        }
      />
    )
  }

  if (!isOwner && !guestMode && !visibilityLoading && business && !canView) {
    return (
      <EmptyState
        icon={FiLock}
        title="Entreprise non accessible"
        description="Cette entreprise a restreint la visibilité de ses publications."
        action={
          <Link to="/businesses">
            <Button variant="secondary" icon={FiArrowLeft}>
              Retour à l'annuaire
            </Button>
          </Link>
        }
      />
    )
  }

  if (!business) {
    return <EmptyState title="Entreprise introuvable" />
  }

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

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Publications entreprise"
        title={business.name}
        description={`${sectorLabel}${locationLabel ? ` · ${locationLabel}` : ''} — contenus publiés au nom de l’entreprise uniquement.`}
        actions={
          <div className="flex flex-wrap gap-3">
            {guestMode ? (
              <Link to="/discover">
                <Button variant="secondary" icon={FiArrowLeft}>
                  Découvrir MOXT
                </Button>
              </Link>
            ) : (
              <>
                <Link to={`/businesses/${business.id}`}>
                  <Button variant="secondary" icon={FiArrowLeft}>
                    Fiche entreprise
                  </Button>
                </Link>
                {!isOwner ? (
                  <>
                    <ContactButton
                      ownerId={business.ownerId}
                      relatedEntity={business}
                      relatedId={business.id}
                      relatedPath={`/businesses/${business.id}/publications/listings`}
                      relatedTitle={business.name}
                      relatedType="business"
                    />
                    <SubscribeButton
                      publisherType="business"
                      publisherId={business.id}
                      publisherName={business.name}
                      publisherPath={`/businesses/${business.id}/publications/listings`}
                    />
                  </>
                ) : null}
                <Link to="/businesses">
                  <Button variant="secondary" icon={HiOutlineBuildingOffice2}>
                    Annuaire
                  </Button>
                </Link>
              </>
            )}
          </div>
        }
      />

      <PublicationProfileCard
        displayName={business.name}
        verified={['verified', 'approved', 'active'].includes(business.status)}
        memberSince={profile.memberSince}
        city={profile.city}
        country={profile.country}
        activeCount={profile.activeCount}
        archivedCount={profile.archivedCount}
        totalCount={profile.totalCount}
        totalViews={profile.totalViews}
        aggregateRating={rating}
        isOwner={isOwner}
        scope="business"
        ownBusiness={business}
        avatarUrl={business.logoUrl}
        contactOwnerId={!isOwner && !guestMode ? business.ownerId : null}
        contactPath={`/businesses/${business.id}/publications/listings`}
        contactTitle={business.name}
        contactEntity={business}
        contactType="business"
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
            <MyListingCard
              key={listing.id}
              listing={listing}
              ownerMode={isOwner}
              showViews={isOwner}
              guestMode={guestMode}
              onGuestInteract={handleGuestInteract}
            />
          ))}
          {visible.parcel.map((parcel) => (
            <MyParcelPublicationCard
              key={parcel.id}
              parcel={parcel}
              readOnly={!isOwner}
              guestMode={guestMode}
              onGuestInteract={handleGuestInteract}
            />
          ))}
          {visible.job.map((job) => (
            <MyJobPublicationCard
              key={job.id}
              job={job}
              readOnly={!isOwner}
              guestMode={guestMode}
              onGuestInteract={handleGuestInteract}
            />
          ))}
          {visible.event.map((event) => (
            <MyEventPublicationCard
              key={event.id}
              event={event}
              readOnly={!isOwner}
              guestMode={guestMode}
              onGuestInteract={handleGuestInteract}
            />
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
