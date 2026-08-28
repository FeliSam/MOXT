import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { CatalogGrid } from '../../components/ui/CatalogGrid'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import {
  duplicateListing,
  updateListingStatus,
} from '../marketplace/marketplaceSlice'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyListingPublicationCard,
  MyP2POfferPublicationCard,
  MyParcelPublicationCard,
  MyVideoPublicationCard,
} from '../publications/MyPublicationCards'
import {
  BUSINESS_PUBLICATION_TYPE_TABS,
  collectBusinessPublications,
  filterPublicationsByTabs,
  publicationArchiveCounts,
  publicationTypeCounts,
  visiblePublicationCount,
  visiblePublicationTypeTabs,
} from '../publications/publicationCatalogUtils'
import { PublicationCatalogNav } from '../publications/PublicationCatalogNav'
import { useRefreshPublicationsData } from '../publications/useRefreshPublicationsData'
import { deleteVideo, duplicateVideo, moderateVideo } from '../videos/videosSlice'
import { businessesText } from './businessesI18n'

const TYPE_LABEL_KEYS = {
  listing: 'businesses.publications.types.listing',
  parcel: 'businesses.publications.types.parcel',
  job: 'businesses.publications.types.job',
  event: 'businesses.publications.types.event',
  video: 'businesses.publications.types.video',
  other: 'businesses.publications.types.other',
}

export function BusinessPublicationsPanel({
  businessId,
  guestMode = false,
  guestPublications = null,
  isOwner = false,
  onGuestInteract,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [deletingVideo, setDeletingVideo] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const marketplaceItems = useSelector((state) => state.marketplace.items)
  const parcelItems = useSelector((state) => state.parcels.items)
  const jobItems = useSelector((state) => state.jobs.items)
  const eventItems = useSelector((state) => state.events.items)
  const offerItems = useSelector((state) => state.p2p.offers)
  const videoItems = useSelector((state) => state.videos.items)

  useRefreshPublicationsData(guestMode ? null : businessId)

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = BUSINESS_PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
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
        videos: { items: videoItems },
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
    videoItems,
  ])

  const archiveCounts = useMemo(
    () => publicationArchiveCounts(publications, { typeTab }),
    [publications, typeTab],
  )
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab),
    [archiveTab, publications],
  )
  const visibleTypeTabs = useMemo(
    () => visiblePublicationTypeTabs(BUSINESS_PUBLICATION_TYPE_TABS, typeCounts),
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
  const showArchives = hasArchives

  useEffect(() => {
    if (visibleTypeTabs.length === 0) return
    if (!visibleTypeTabs.some((tab) => tab.id === typeTab)) {
      setTypeTab(visibleTypeTabs[0].id)
    }
  }, [typeTab, visibleTypeTabs])

  useEffect(() => {
    if (!showArchives && archiveTab === 'archived') {
      setArchiveTab('active')
    }
  }, [archiveTab, showArchives])

  return (
    <div className="grid gap-4">
      <PublicationCatalogNav
        typeTab={typeTab}
        onTypeTab={setTypeTab}
        typeTabs={visibleTypeTabs}
        typeCounts={typeCounts}
        typeLabel={(tab) => (TYPE_LABEL_KEYS[tab.id] ? bt(TYPE_LABEL_KEYS[tab.id]) : tab.label)}
        archiveTab={archiveTab}
        onArchiveTab={setArchiveTab}
        archiveCounts={archiveCounts}
        showArchives={showArchives}
        activeLabel={bt('businesses.publications.tabs.active')}
        archivedLabel={bt('businesses.publications.tabs.archived')}
      />

      {hasContent ? (
        <div className="grid gap-6">
          {visible.listing.length ? (
            <CatalogGrid lazy={false}>
              {visible.listing.map((listing) => (
                <MyListingPublicationCard
                  key={listing.id}
                  listing={listing}
                  readOnly={!isOwner}
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                  onArchive={() =>
                    dispatch(
                      updateListingStatus({
                        id: listing.id,
                        status: 'archived',
                        actorId: user?.id,
                      }),
                    )
                  }
                  onReactivate={() =>
                    dispatch(
                      updateListingStatus({
                        id: listing.id,
                        status: 'active',
                        actorId: user?.id,
                      }),
                    )
                  }
                  onDuplicate={() =>
                    dispatch(duplicateListing({ listing, ownerId: user?.id }))
                  }
                  onMarkSold={() =>
                    dispatch(
                      updateListingStatus({
                        id: listing.id,
                        status: 'sold',
                        actorId: user?.id,
                      }),
                    )
                  }
                />
              ))}
            </CatalogGrid>
          ) : null}
          {visible.parcel.length ||
          visible.job.length ||
          visible.event.length ||
          visible.video?.length ||
          visible.other.length ? (
            <CatalogGrid lazy={false}>
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
              {(visible.video || []).map((video) => (
                <MyVideoPublicationCard
                  key={video.id}
                  video={video}
                  readOnly={!isOwner}
                  guestMode={guestMode}
                  onGuestInteract={onGuestInteract}
                  onArchive={() => dispatch(moderateVideo({ id: video.id, status: 'archived' }))}
                  onReactivate={() => dispatch(moderateVideo({ id: video.id, status: 'active' }))}
                  onDuplicate={() => dispatch(duplicateVideo({ video, ownerId: user?.id }))}
                  onDelete={() => setDeletingVideo(video)}
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
            </CatalogGrid>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={bt('businesses.publications.emptyTitle')}
          description={bt('businesses.publications.emptyDescription')}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingVideo)}
        title={p3('publications.cards.deleteConfirmTitle')}
        description={p3('publications.cards.deleteConfirmDescription')}
        onCancel={() => setDeletingVideo(null)}
        onConfirm={() => {
          if (deletingVideo?.id && user?.id) {
            dispatch(deleteVideo({ id: deletingVideo.id, ownerId: user.id }))
          }
          setDeletingVideo(null)
        }}
      />
    </div>
  )
}
