import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { CatalogArchiveTabs } from '../../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../../components/ui/CatalogGrid'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { MyListingCard } from '../marketplace/MyListingCard'
import { MarketplaceListingCard } from '../marketplace/MarketplaceListingCard'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyP2POfferPublicationCard,
  MyParcelPublicationCard,
} from '../publications/MyPublicationCards'
import {
  collectBusinessPublications,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTypeCounts,
  visiblePublicationCount,
  visiblePublicationTypeTabs,
} from '../publications/publicationCatalogUtils'
import { useRefreshPublicationsData } from '../publications/useRefreshPublicationsData'
import { businessesText } from './businessesI18n'

const TYPE_LABEL_KEYS = {
  listing: 'businesses.publications.types.listing',
  parcel: 'businesses.publications.types.parcel',
  job: 'businesses.publications.types.job',
  event: 'businesses.publications.types.event',
  other: 'businesses.publications.types.other',
}

const BUSINESS_TYPE_TABS = PUBLICATION_TYPE_TABS.filter((tab) => tab.id !== 'post')

export function BusinessPublicationsPanel({
  businessId,
  guestMode = false,
  guestPublications = null,
  isOwner = false,
  onGuestInteract,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const marketplaceItems = useSelector((state) => state.marketplace.items)
  const parcelItems = useSelector((state) => state.parcels.items)
  const jobItems = useSelector((state) => state.jobs.items)
  const eventItems = useSelector((state) => state.events.items)
  const offerItems = useSelector((state) => state.p2p.offers)

  useRefreshPublicationsData(guestMode ? null : businessId)

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = BUSINESS_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'

  const publications = useMemo(() => {
    if (guestMode) {
      return (
        guestPublications || {
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
    guestPublications,
    jobItems,
    marketplaceItems,
    offerItems,
    parcelItems,
  ])

  const archiveCounts = useMemo(() => publicationArchiveCounts(publications), [publications])
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab),
    [archiveTab, publications],
  )
  const visibleTypeTabs = useMemo(
    () => visiblePublicationTypeTabs(BUSINESS_TYPE_TABS, typeCounts),
    [typeCounts],
  )
  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab, typeTab }),
    [archiveTab, publications, typeTab],
  )
  const hasContent = visiblePublicationCount(visible) > 0

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

  const hasArchives = archiveCounts.archived > 0

  useEffect(() => {
    if (visibleTypeTabs.length === 0) return
    if (!visibleTypeTabs.some((tab) => tab.id === typeTab)) {
      setTypeTab(visibleTypeTabs[0].id)
    }
  }, [typeTab, visibleTypeTabs])

  useEffect(() => {
    if (!hasArchives && archiveTab === 'archived') {
      setArchiveTab('active')
    }
  }, [archiveTab, hasArchives])

  return (
    <div className="grid gap-4">
      {visibleTypeTabs.length > 0 ? (
        <CatalogArchiveTabs
          active={typeTab}
          onChange={setTypeTab}
          tabs={visibleTypeTabs.map((tab) => ({
            key: tab.id,
            label: TYPE_LABEL_KEYS[tab.id] ? bt(TYPE_LABEL_KEYS[tab.id]) : tab.label,
            count: typeCounts[tab.id],
          }))}
        />
      ) : null}

      {hasArchives ? (
        <CatalogArchiveTabs
          active={archiveTab}
          onChange={setArchiveTab}
          variant="filter"
          tabs={[
            {
              key: 'active',
              label: bt('businesses.publications.tabs.active'),
              count: archiveCounts.active,
            },
            {
              key: 'archived',
              label: bt('businesses.publications.tabs.archived'),
              count: archiveCounts.archived,
            },
          ]}
        />
      ) : null}

      {hasContent ? (
        <div className="grid gap-6">
          {visible.listing.length ? (
            isOwner ? (
              <div className="grid gap-4">
                {visible.listing.map((listing) => (
                  <MyListingCard
                    key={listing.id}
                    listing={listing}
                    ownerMode={isOwner}
                    showViews={isOwner}
                    guestMode={guestMode}
                    onGuestInteract={onGuestInteract}
                  />
                ))}
              </div>
            ) : (
              <CatalogGrid lazy={false}>
                {visible.listing.map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    listing={listing}
                    guestMode={guestMode}
                    onGuestInteract={onGuestInteract}
                  />
                ))}
              </CatalogGrid>
            )
          ) : null}
          {visible.parcel.length ||
          visible.job.length ||
          visible.event.length ||
          visible.other.length ? (
            <div className="grid gap-4">
              {visible.parcel.map((parcel) => (
                <MyParcelPublicationCard
                  key={parcel.id}
                  parcel={parcel}
                  readOnly={!isOwner}
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                />
              ))}
              {visible.job.map((job) => (
                <MyJobPublicationCard
                  key={job.id}
                  job={job}
                  readOnly={!isOwner}
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                />
              ))}
              {visible.event.map((event) => (
                <MyEventPublicationCard
                  key={event.id}
                  event={event}
                  readOnly={!isOwner}
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                />
              ))}
              {visible.other.map((offer) => (
                <MyP2POfferPublicationCard
                  key={offer.id}
                  offer={offer}
                  readOnly
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={bt('businesses.publications.emptyTitle')}
          description={bt('businesses.publications.emptyDescription')}
        />
      )}
    </div>
  )
}
