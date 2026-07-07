import { useMemo, useState } from 'react'
import {
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiFileText,
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
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyPostPublicationCard,
  MyParcelPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  collectUserPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTotalViews,
  publicationTypeCounts,
  visiblePublicationCount,
} from '../features/publications/publicationCatalogUtils'
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { canRepublishBusinessItem } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'

const PUBLISH_LINKS = {
  listing: { to: '/marketplace/publish', label: 'Publier une annonce' },
  parcel: { to: '/parcels/publish', label: 'Publier un colis' },
  job: { to: '/jobs/publish', label: 'Publier un job' },
  event: { to: '/events/publish', label: 'Publier un événement' },
  post: { to: '/news', label: 'Publier sur le fil' },
  other: { to: '/dashboard', label: 'Explorer les services' },
}

const EMPTY_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  post: FiFileText,
  other: FiFileText,
}

export function MyPublicationsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deletingListing, setDeletingListing] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)
  const ownBusiness = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const businessById = useMemo(
    () => new Map(appState.businesses.items.map((item) => [item.id, item])),
    [appState.businesses.items],
  )

  function guardBusinessRepublish(item) {
    if (canRepublishBusinessItem(item, businessById)) return true
    dispatch(
      addToast({
        title: 'Republication impossible',
        message:
          'Votre entreprise doit être vérifiée par MOXT pour republier ce contenu au nom de l’entreprise.',
        tone: 'error',
      }),
    )
    return false
  }

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'all'

  const publications = useMemo(
    () => filterPublicationsByScope(collectUserPublications(appState, user.id), scope),
    [appState, scope, user.id],
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

  function setScope(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('scope')
    else params.set('scope', next)
    setSearchParams(params, { replace: true })
  }

  const publishLink = PUBLISH_LINKS[typeTab] || PUBLISH_LINKS.listing
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes publications"
        description={
          scope === 'business' && ownBusiness
            ? `Publications publiées au nom de ${ownBusiness.name}.`
            : 'Annonces, colis, jobs, événements, publications et autres contenus.'
        }
        stats={[
          { label: 'Actives', value: archiveCounts.active },
          { label: 'Archives', value: archiveCounts.archived },
          { label: 'Vues annonces', value: totalViews },
        ]}
        actions={
          <>
            <PublicationScopeButton
              business={ownBusiness}
              onScopeChange={setScope}
              scope={scope}
            />
            <Link
              to={`/users/${user.id}/publications${scope === 'business' ? '?scope=business' : ''}`}
            >
              <Button variant="secondary" icon={FiEye}>
                Vue publique
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

        <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1">
          {PUBLICATION_TYPE_TABS.map((tab) => (
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
              ownerMode
              showViews
              onDuplicate={() => dispatch(duplicateListing({ listing, ownerId: user.id }))}
              onRepublish={() => {
                if (!guardBusinessRepublish(listing)) return
                dispatch(updateListingStatus({ id: listing.id, status: 'active', actorId: user.id }))
              }}
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
              onReactivate={() => {
                if (!guardBusinessRepublish(parcel)) return
                dispatch(updateParcelStatus({ id: parcel.id, status: 'active' }))
              }}
            />
          ))}
          {visible.job.map((job) => (
            <MyJobPublicationCard
              key={job.id}
              job={job}
              onArchive={() => dispatch(moderateJob({ id: job.id, status: 'archived' }))}
              onReactivate={() => {
                if (!guardBusinessRepublish(job)) return
                dispatch(moderateJob({ id: job.id, status: 'active' }))
              }}
            />
          ))}
          {visible.event.map((event) => (
            <MyEventPublicationCard
              key={event.id}
              event={event}
              onArchive={() => dispatch(moderateEvent({ id: event.id, status: 'archived' }))}
              onReactivate={() => {
                if (!guardBusinessRepublish(event)) return
                dispatch(moderateEvent({ id: event.id, status: 'published' }))
              }}
            />
          ))}
          {visible.post.map((post) => (
            <MyPostPublicationCard
              key={post.id}
              post={post}
              onDelete={() => dispatch(deletePost(post.id))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={EmptyIcon}
          title={archiveTab === 'active' ? 'Aucune publication active' : 'Aucune archive'}
          description={`Aucun contenu dans ${PUBLICATION_TYPE_TABS.find((t) => t.id === typeTab)?.label || 'cette catégorie'}.`}
          action={
            archiveTab === 'active' && typeTab !== 'other' ? (
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
