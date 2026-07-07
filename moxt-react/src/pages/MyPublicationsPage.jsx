import { useMemo, useState } from 'react'
import {
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiPackage,
  FiPlus,
  FiShoppingBag,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import { deletePost } from '../features/posts/postsSlice'
import { moderateEvent } from '../features/events/eventSlice'
import { moderateJob } from '../features/jobs/jobSlice'
import { updateParcelStatus } from '../features/parcels/parcelSlice'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  deleteListing,
  duplicateListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import {
  MyJobPublicationCard,
  MyOtherPublicationCard,
  MyParcelPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  collectUserPublications,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTotalViews,
  publicationTypeCounts,
} from '../features/publications/publicationCatalogUtils'

const PUBLISH_LINKS = {
  listing: { to: '/marketplace/publish', label: 'Publier une annonce' },
  parcel: { to: '/parcels/publish', label: 'Publier un colis' },
  job: { to: '/jobs/publish', label: 'Publier un job' },
  other: { to: '/events/publish', label: 'Publier un événement' },
}

export function MyPublicationsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deletingListing, setDeletingListing] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'

  const publications = useMemo(
    () => collectUserPublications(appState, user.id),
    [appState, user.id],
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
  const totalViews = publicationTotalViews(publications)
  const hasContent =
    visible.listing.length + visible.parcel.length + visible.job.length + visible.other.length > 0

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

  const publishLink = PUBLISH_LINKS[typeTab] || PUBLISH_LINKS.listing

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes publications"
        description="Annonces, colis, jobs, événements et autres contenus — actifs et archives."
        stats={[
          { label: 'Actives', value: archiveCounts.active },
          { label: 'Archives', value: archiveCounts.archived },
          { label: 'Vues annonces', value: totalViews },
        ]}
        actions={
          <>
            <Link to={`/users/${user.id}/annonces`}>
              <Button variant="secondary" icon={FiEye}>
                Vue publique annonces
              </Button>
            </Link>
            <Link to={publishLink.to}>
              <Button icon={FiPlus}>{publishLink.label}</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4">
        <CatalogArchiveTabs
          active={archiveTab}
          onChange={setArchiveTab}
          tabs={[
            { key: 'active', label: 'Actives', count: archiveCounts.active },
            { key: 'archived', label: 'Archives', count: archiveCounts.archived },
          ]}
        />

        <div className="scrollbar-hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {PUBLICATION_TYPE_TABS.map((tab) => (
            <PillBadge
              key={tab.id}
              active={typeTab === tab.id}
              onClick={() => setTypeTab(tab.id)}
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
              ownerMode
              showViews
              onDuplicate={() => dispatch(duplicateListing({ listing, ownerId: user.id }))}
              onRepublish={() =>
                dispatch(updateListingStatus({ id: listing.id, status: 'active', actorId: user.id }))
              }
              onMarkSold={() =>
                dispatch(updateListingStatus({ id: listing.id, status: 'sold', actorId: user.id }))
              }
              onArchive={() =>
                dispatch(updateListingStatus({ id: listing.id, status: 'archived', actorId: user.id }))
              }
              onDelete={() => setDeletingListing(listing)}
            />
          ))}
          {visible.parcel.map((parcel) => (
            <MyParcelPublicationCard
              key={parcel.id}
              parcel={parcel}
              onArchive={() =>
                dispatch(updateParcelStatus({ id: parcel.id, status: 'completed' }))
              }
              onReactivate={() =>
                dispatch(updateParcelStatus({ id: parcel.id, status: 'active' }))
              }
            />
          ))}
          {visible.job.map((job) => (
            <MyJobPublicationCard
              key={job.id}
              job={job}
              onArchive={() => dispatch(moderateJob({ id: job.id, status: 'archived' }))}
              onReactivate={() => dispatch(moderateJob({ id: job.id, status: 'active' }))}
            />
          ))}
          {visible.other.map((entry) => (
            <MyOtherPublicationCard
              key={`${entry.kind}-${entry.item.id}`}
              entry={entry}
              onArchive={() => {
                if (entry.kind === 'event') {
                  dispatch(moderateEvent({ id: entry.item.id, status: 'archived' }))
                }
              }}
              onReactivate={() => {
                if (entry.kind === 'event') {
                  dispatch(moderateEvent({ id: entry.item.id, status: 'published' }))
                }
              }}
              onDelete={
                entry.kind === 'post'
                  ? () => dispatch(deletePost(entry.item.id))
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            typeTab === 'parcel'
              ? FiPackage
              : typeTab === 'job'
                ? FiBriefcase
                : typeTab === 'other'
                  ? FiCalendar
                  : FiShoppingBag
          }
          title={
            archiveTab === 'active'
              ? `Aucune publication active`
              : `Aucune archive`
          }
          description={`Aucun contenu dans ${PUBLICATION_TYPE_TABS.find((t) => t.id === typeTab)?.label || 'cette catégorie'}.`}
          action={
            archiveTab === 'active' ? (
              <Link to={publishLink.to}>
                <Button icon={FiPlus}>{publishLink.label}</Button>
              </Link>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingListing)}
        title="Supprimer cette annonce ?"
        description="Cette suppression locale est définitive et retire également ses signalements."
        onCancel={() => setDeletingListing(null)}
        onConfirm={() => {
          dispatch(deleteListing({ id: deletingListing.id, ownerId: user.id }))
          setDeletingListing(null)
        }}
      />
    </div>
  )
}
