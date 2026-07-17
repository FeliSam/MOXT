import { useMemo, useState } from 'react'
import {
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiFileText,
  FiPackage,
  FiPlus,
  FiShoppingBag,
  FiUsers,
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
import { SubscribersPanel } from '../features/account/SubscribersPanel'
import { canRepublishBusinessItem } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { useLanguage } from '../contexts/useLanguage'
import { phase3Text } from '../i18n/phase3I18n'

const PUBLISH_LINKS = {
  listing: { to: '/marketplace/publish', labelKey: 'publications.mine.publish.listing' },
  parcel: { to: '/parcels/publish', labelKey: 'publications.mine.publish.parcel' },
  job: { to: '/jobs/publish', labelKey: 'publications.mine.publish.job' },
  event: { to: '/events/publish', labelKey: 'publications.mine.publish.event' },
  post: { to: '/news', labelKey: 'publications.mine.publish.post' },
  other: { to: '/dashboard', labelKey: 'publications.mine.publish.other' },
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
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
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
        title: p3('publications.mine.republishDenied.title'),
        message: p3('publications.mine.republishDenied.message'),
        tone: 'error',
      }),
    )
    return false
  }

  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const panel = searchParams.get('panel') === 'subscribers' ? 'subscribers' : 'publications'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'personal'

  const publications = useMemo(
    () => filterPublicationsByScope(collectUserPublications(appState, user.id), scope),
    [appState, scope, user.id],
  )
  const archiveCounts = useMemo(
    () => publicationArchiveCounts(publications, { includePending: true }),
    [publications],
  )
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab, { includePending: true }),
    [archiveTab, publications],
  )
  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab, typeTab, includePending: true }),
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
    if (next === 'personal') params.delete('scope')
    else params.set('scope', next)
    setSearchParams(params, { replace: true })
  }

  function setPanel(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'publications') params.delete('panel')
    else params.set('panel', next)
    setSearchParams(params, { replace: true })
  }

  const publishLink = PUBLISH_LINKS[typeTab] || PUBLISH_LINKS.listing
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  const subscriberPublisherType = scope === 'business' && ownBusiness ? 'business' : 'user'
  const subscriberPublisherId =
    scope === 'business' && ownBusiness ? ownBusiness.id : user.id
  const subscriberPublisherName =
    scope === 'business' && ownBusiness
      ? ownBusiness.name
      : fullName || p3('publications.mine.profileFallback')
  const subscriberPublisherPath =
    scope === 'business' && ownBusiness
      ? `/businesses/${ownBusiness.id}`
      : `/users/${user.id}/publications`

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('publications.mine.eyebrow')}
        title={p3('publications.mine.title')}
        description={
          panel === 'subscribers'
            ? p3('publications.mine.description.subscribers')
            : scope === 'business' && ownBusiness
              ? p3('publications.mine.description.business', { name: ownBusiness.name })
              : p3('publications.mine.description.personal')
        }
        stats={[
          { label: p3('publications.mine.stats.active'), value: archiveCounts.active },
          { label: p3('publications.mine.stats.archived'), value: archiveCounts.archived },
          { label: p3('publications.mine.stats.views'), value: totalViews },
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
                {p3('publications.mine.publicView')}
              </Button>
            </Link>
            <Link to={publishLink.to}>
              <Button icon={FiPlus}>{p3(publishLink.labelKey)}</Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <PillBadge active={panel === 'publications'} onClick={() => setPanel('publications')}>
          {p3('publications.mine.tabs.publications')}
        </PillBadge>
        <PillBadge active={panel === 'subscribers'} onClick={() => setPanel('subscribers')}>
          <FiUsers className="mr-1 inline" />
          {p3('publications.mine.tabs.subscribers')}
        </PillBadge>
      </div>

      {panel === 'subscribers' ? (
        <SubscribersPanel
          publisherType={subscriberPublisherType}
          publisherId={subscriberPublisherId}
          publisherName={subscriberPublisherName}
          publisherPath={subscriberPublisherPath}
        />
      ) : (
        <>
      <div className="grid gap-4">
        <CatalogArchiveTabs
          active={archiveTab}
          onChange={setArchiveTab}
          variant="filter"
          tabs={[
            {
              key: 'active',
              label: p3('publications.mine.stats.active'),
              count: archiveCounts.active,
            },
            {
              key: 'archived',
              label: p3('publications.mine.stats.archived'),
              count: archiveCounts.archived,
            },
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
              {p3(`publications.mine.types.${tab.id}`)} ({typeCounts[tab.id]})
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
          title={
            archiveTab === 'active'
              ? p3('publications.mine.empty.active')
              : p3('publications.mine.empty.archived')
          }
          description={p3('publications.mine.empty.description', {
            category: PUBLICATION_TYPE_TABS.some((tab) => tab.id === typeTab)
              ? p3(`publications.mine.types.${typeTab}`)
              : p3('publications.mine.empty.category'),
          })}
          action={
            archiveTab === 'active' && typeTab !== 'other' ? (
              <Link to={publishLink.to}>
                <Button icon={FiPlus}>{p3(publishLink.labelKey)}</Button>
              </Link>
            ) : null
          }
        />
      )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deletingListing)}
        title={p3('publications.mine.delete.title')}
        description={p3('publications.mine.delete.description')}
        onCancel={() => setDeletingListing(null)}
        onConfirm={() => {
          dispatch(deleteListing({ id: deletingListing.id, ownerId: user.id }))
          setDeletingListing(null)
        }}
      />
    </div>
  )
}
