import { useEffect, useMemo, useState } from 'react'
import {
  FiArchive,
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiFileText,
  FiPackage,
  FiPlay,
  FiPlus,
  FiRepeat,
  FiShoppingBag,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { deletePost, moderatePost } from '../features/posts/postsSlice'
import { deleteEvent, duplicateEvent, moderateEvent } from '../features/events/eventSlice'
import { deleteVideo, duplicateVideo, moderateVideo } from '../features/videos/videosSlice'
import { deleteJob, duplicateJob, moderateJob } from '../features/jobs/jobSlice'
import { deleteParcel, duplicateParcel, updateParcelStatus } from '../features/parcels/parcelSlice'
import { deleteOffer, updateOfferStatus } from '../features/p2p/p2pSlice'
import {
  deleteListing,
  duplicateListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import { selectPublisherSubscribers } from '../features/account/subscriptionSelectors'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyListingPublicationCard,
  MyP2POfferPublicationCard,
  MyParcelPublicationCard,
  MyPostPublicationCard,
  MyVideoPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  BUSINESS_PUBLICATION_TYPE_TABS,
  buildUserPublicationProfile,
  collectUserPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTotalCount,
  publicationTypeCounts,
  visiblePublicationCount,
  visiblePublicationTypeTabs,
} from '../features/publications/publicationCatalogUtils'
import { PublicationCatalogNav } from '../features/publications/PublicationCatalogNav'
import { PublicationProfileCard } from '../features/publications/PublicationProfileCard'
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { usePublicationProfile } from '../features/publications/usePublicationProfile'
import { SubscribersPanel } from '../features/account/SubscribersPanel'
import { canRepublishBusinessItem } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { useScopedProfileReviews } from '../features/reviews/useScopedTargetReviews'
import { useLanguage } from '../contexts/useLanguage'
import { phase3Text } from '../i18n/phase3I18n'
import { BoostPublicationSheet } from '../features/stars/BoostPublicationSheet'
import { useStarsBoostFlow } from '../features/stars/useStarsBoostFlow'
import { useStarsModuleEnabled } from '../features/stars/useStarsModuleEnabled'
import { StarsSpendConfirm } from '../features/stars/StarsSpendConfirm'
import { withStarsBoost, StarsInsufficientError } from '../features/stars/starsBoost'
import {
  activeBoostForEntity,
  publicationTypeToEntityType,
} from '../features/stars/publicationBoostUtils'
import { loadFeedBoosts } from '../features/stars/starsSlice'

const PUBLISH_LINKS = {
  listing: { to: '/marketplace/publish', labelKey: 'publications.mine.publish.listing' },
  parcel: { to: '/parcels/publish', labelKey: 'publications.mine.publish.parcel' },
  job: { to: '/jobs/publish', labelKey: 'publications.mine.publish.job' },
  event: { to: '/events/publish', labelKey: 'publications.mine.publish.event' },
  video: { to: '/videos/publish', labelKey: 'publications.mine.publish.video' },
  post: { to: '/news', labelKey: 'publications.mine.publish.post' },
  other: { to: '/p2p/publish', labelKey: 'p2p.page.proposeOffer' },
}

const EMPTY_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  video: FiPlay,
  post: FiFileText,
  other: FiRepeat,
}

export function MyPublicationsPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deletingItem, setDeletingItem] = useState(null)
  const boostFlow = useStarsBoostFlow()
  const starsEnabled = useStarsModuleEnabled()
  const feedBoosts = useSelector((state) => state.stars.feedBoosts)
  const starsBalance = useSelector((state) => state.stars.balance)
  const user = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)
  const ownBusiness = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const businessById = useMemo(
    () => new Map(appState.businesses.items.map((item) => [item.id, item])),
    [appState.businesses.items],
  )
  const { profile: memberProfile } = usePublicationProfile(user.id, user)

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
  const typeTabSource = scope === 'business' ? BUSINESS_PUBLICATION_TYPE_TABS : PUBLICATION_TYPE_TABS
  const archiveCounts = useMemo(
    () => publicationArchiveCounts(publications, { includePending: true, typeTab }),
    [publications, typeTab],
  )
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab, { includePending: true }),
    [archiveTab, publications],
  )
  const visibleTypeTabs = useMemo(
    () => visiblePublicationTypeTabs(typeTabSource, typeCounts),
    [typeCounts, typeTabSource],
  )
  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab, typeTab, includePending: true }),
    [archiveTab, publications, typeTab],
  )
  const hasContent = visiblePublicationCount(visible) > 0
  const hasAnyPublication = publicationTotalCount(publications) > 0
  const hasArchives = archiveCounts.archived > 0
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  const displayName = fullName || p3('publications.mine.profileFallback')
  const profile = useMemo(
    () => buildUserPublicationProfile(user.id, publications, { displayName }),
    [displayName, publications, user.id],
  )
  const { rating: aggregateRating } = useScopedProfileReviews(user.id, publications, {
    enabled: Boolean(user.id),
  })
  const subscriberPublisherType = scope === 'business' && ownBusiness ? 'business' : 'user'
  const subscriberPublisherId = scope === 'business' && ownBusiness ? ownBusiness.id : user.id
  const subscriberPublisherName =
    scope === 'business' && ownBusiness ? ownBusiness.name : displayName
  const subscriberPublisherPath =
    scope === 'business' && ownBusiness
      ? `/businesses/${ownBusiness.id}`
      : `/users/${user.id}/publications`
  const subscriberCount = useSelector((state) =>
    selectPublisherSubscribers(state, subscriberPublisherType, subscriberPublisherId),
  ).length

  useEffect(() => {
    dispatch(loadFeedBoosts())
  }, [dispatch])

  function boostOwner() {
    if (scope === 'business' && ownBusiness) {
      return { ownerType: 'business', ownerId: ownBusiness.id }
    }
    return { ownerType: 'user', ownerId: user?.id }
  }

  function publicationBoostProps(type, item) {
    const entityType = publicationTypeToEntityType(type)
    if (!entityType || !item?.id) return {}
    const owner = boostOwner()
    const label =
      item.title ||
      item.message?.slice?.(0, 40) ||
      item.id
    return {
      onBoost: starsEnabled
        ? () =>
            boostFlow.openBoost({
              entityType,
              entityId: item.id,
              label,
              ...owner,
            })
        : undefined,
      activeBoost: starsEnabled ? activeBoostForEntity(feedBoosts, entityType, item.id) : null,
    }
  }

  async function handleBoostSelect(durationKey) {
    const target = boostFlow.target
    if (!target) return
    boostFlow.setLoading(true)
    try {
      const outcome = await withStarsBoost({
        entityType: target.entityType,
        entityId: target.entityId,
        durationKey,
        ownerType: target.ownerType,
        ownerId: target.ownerId,
        confirmPaid: boostFlow.confirmPaid,
      })
      if (outcome?.cancelled) return
      dispatch(loadFeedBoosts())
      dispatch(
        addToast({
          title: t('stars.boost.successTitle'),
          message: t('stars.boost.successBody'),
          tone: 'success',
        }),
      )
      boostFlow.closeBoost()
    } catch (error) {
      dispatch(
        addToast({
          title:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientTitle')
              : t('stars.boost.failedTitle'),
          message:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientBody')
              : error?.message || t('stars.boost.failedBody'),
          tone: 'error',
        }),
      )
    } finally {
      boostFlow.setLoading(false)
    }
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

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip sm:gap-7">
      <PublicationProfileCard
        displayName={displayName}
        verified={Boolean(memberProfile?.verified)}
        memberSince={memberProfile?.memberSince}
        city={memberProfile?.city || profile.city}
        country={memberProfile?.country || profile.country}
        activeCount={profile.activeCount}
        archivedCount={profile.archivedCount}
        totalCount={profile.totalCount}
        totalViews={profile.totalViews}
        aggregateRating={aggregateRating}
        isOwner
        scope={scope}
        ownBusiness={ownBusiness}
        shareUserId={user.id}
        avatarUrl={memberProfile?.avatarUrl}
        actions={
          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,12.5rem),1fr))] gap-2 border-t border-[var(--app-border)] pt-4 [&>a]:min-w-0 [&>button]:min-w-0 [&_button]:min-w-0 [&_button]:w-full [&_button]:max-w-full [&_button]:flex-wrap [&_button]:whitespace-normal">
            <PublicationScopeButton business={ownBusiness} onScopeChange={setScope} scope={scope} />
            <Link
              to={`/users/${user.id}/publications${scope === 'business' ? '?scope=business' : ''}`}
              className="min-w-0"
            >
              <Button variant="secondary" icon={FiEye} className="w-full min-w-0 max-w-full flex-wrap whitespace-normal">
                {p3('publications.mine.publicView')}
              </Button>
            </Link>
            <Link to={publishLink.to} className="min-w-0">
              <Button icon={FiPlus} className="w-full min-w-0 max-w-full flex-wrap whitespace-normal">
                {p3(publishLink.labelKey)}
              </Button>
            </Link>
          </div>
        }
      />

      <CatalogArchiveTabs
        active={panel}
        onChange={setPanel}
        variant="section"
        tabs={[
          {
            key: 'publications',
            label: p3('publications.mine.tabs.publications'),
            count: profile.totalCount,
            alwaysShow: true,
          },
          {
            key: 'subscribers',
            label: p3('publications.mine.tabs.subscribers'),
            count: subscriberCount,
            alwaysShow: true,
          },
        ]}
      />

      {panel === 'subscribers' ? (
        <SubscribersPanel
          publisherType={subscriberPublisherType}
          publisherId={subscriberPublisherId}
          publisherName={subscriberPublisherName}
          publisherPath={subscriberPublisherPath}
        />
      ) : (
        <div className="grid gap-4">
          <PublicationCatalogNav
            typeTab={typeTab}
            onTypeTab={setTypeTab}
            typeTabs={visibleTypeTabs}
            typeCounts={typeCounts}
            typeLabel={(tab) => p3(`publications.mine.types.${tab.id}`)}
            archiveTab={archiveTab}
            onArchiveTab={setArchiveTab}
            archiveCounts={archiveCounts}
            showArchives={hasArchives}
            activeLabel={p3('publications.mine.stats.active')}
            archivedLabel={p3('publications.mine.stats.archived')}
          />

          {!hasAnyPublication ? (
            <EmptyState
              icon={FiShoppingBag}
              title={p3('publications.user.empty.title')}
              description={p3('publications.user.empty.description')}
              action={
                <Link to={publishLink.to}>
                  <Button icon={FiPlus}>{p3(publishLink.labelKey)}</Button>
                </Link>
              }
            />
          ) : hasContent ? (
            <div className="grid gap-6">
              {visible.listing.length ? (
                <CatalogGrid lazy={false}>
                  {visible.listing.map((listing) => (
                    <MyListingPublicationCard
                      key={listing.id}
                      listing={listing}
                      {...publicationBoostProps('listing', listing)}
                      onArchive={() =>
                        dispatch(
                          updateListingStatus({
                            id: listing.id,
                            status: 'archived',
                            actorId: user.id,
                          }),
                        )
                      }
                      onReactivate={() => {
                        if (!guardBusinessRepublish(listing)) return
                        dispatch(
                          updateListingStatus({
                            id: listing.id,
                            status: 'active',
                            actorId: user.id,
                          }),
                        )
                      }}
                      onDuplicate={() =>
                        dispatch(duplicateListing({ listing, ownerId: user.id }))
                      }
                      onMarkSold={() =>
                        dispatch(
                          updateListingStatus({
                            id: listing.id,
                            status: 'sold',
                            actorId: user.id,
                          }),
                        )
                      }
                      onDelete={() => setDeletingItem({ type: 'listing', item: listing })}
                    />
                  ))}
                </CatalogGrid>
              ) : null}
              {visible.post.length ? (
                <CatalogGrid lazy={false}>
                  {visible.post.map((post) => (
                    <MyPostPublicationCard
                      key={post.id}
                      post={post}
                      onArchive={() => dispatch(moderatePost({ id: post.id, status: 'archived' }))}
                      onReactivate={() =>
                        dispatch(moderatePost({ id: post.id, status: 'published' }))
                      }
                      onDelete={() => setDeletingItem({ type: 'post', item: post })}
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
                      {...publicationBoostProps('parcel', parcel)}
                      onArchive={() =>
                        dispatch(updateParcelStatus({ id: parcel.id, status: 'archived' }))
                      }
                      onReactivate={() => {
                        if (!guardBusinessRepublish(parcel)) return
                        dispatch(updateParcelStatus({ id: parcel.id, status: 'active' }))
                      }}
                      onDuplicate={() => dispatch(duplicateParcel({ parcel, ownerId: user.id }))}
                      onDelete={() => setDeletingItem({ type: 'parcel', item: parcel })}
                    />
                  ))}
                  {visible.job.map((job) => (
                    <MyJobPublicationCard
                      key={job.id}
                      job={job}
                      {...publicationBoostProps('job', job)}
                      onArchive={() => dispatch(moderateJob({ id: job.id, status: 'archived' }))}
                      onReactivate={() => {
                        if (!guardBusinessRepublish(job)) return
                        dispatch(moderateJob({ id: job.id, status: 'active' }))
                      }}
                      onDuplicate={() => dispatch(duplicateJob({ job, ownerId: user.id }))}
                      onDelete={() => setDeletingItem({ type: 'job', item: job })}
                    />
                  ))}
                  {visible.event.map((event) => (
                    <MyEventPublicationCard
                      key={event.id}
                      event={event}
                      {...publicationBoostProps('event', event)}
                      onArchive={() => dispatch(moderateEvent({ id: event.id, status: 'archived' }))}
                      onReactivate={() => {
                        if (!guardBusinessRepublish(event)) return
                        dispatch(moderateEvent({ id: event.id, status: 'published' }))
                      }}
                      onDuplicate={() => dispatch(duplicateEvent({ event, ownerId: user.id }))}
                      onDelete={() => setDeletingItem({ type: 'event', item: event })}
                    />
                  ))}
                  {(visible.video || []).map((video) => (
                    <MyVideoPublicationCard
                      key={video.id}
                      video={video}
                      {...publicationBoostProps('video', video)}
                      onArchive={() => dispatch(moderateVideo({ id: video.id, status: 'archived' }))}
                      onReactivate={() => {
                        if (!guardBusinessRepublish(video)) return
                        dispatch(moderateVideo({ id: video.id, status: 'active' }))
                      }}
                      onDuplicate={() => dispatch(duplicateVideo({ video, ownerId: user.id }))}
                      onDelete={() => setDeletingItem({ type: 'video', item: video })}
                    />
                  ))}
                  {visible.other.map((offer) => (
                    <MyP2POfferPublicationCard
                      key={offer.id}
                      offer={offer}
                      onArchive={() =>
                        dispatch(updateOfferStatus({ id: offer.id, status: 'archived' }))
                      }
                      onReactivate={() => {
                        if (!guardBusinessRepublish(offer)) return
                        dispatch(updateOfferStatus({ id: offer.id, status: 'active' }))
                      }}
                      onDelete={() => setDeletingItem({ type: 'other', item: offer })}
                    />
                  ))}
                </CatalogGrid>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={archiveTab === 'archived' ? FiArchive : EmptyIcon}
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
                archiveTab === 'active' ? (
                  <Link to={publishLink.to}>
                    <Button icon={FiPlus}>{p3(publishLink.labelKey)}</Button>
                  </Link>
                ) : null
              }
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title={p3('publications.cards.deleteConfirmTitle')}
        description={p3('publications.cards.deleteConfirmDescription')}
        onCancel={() => setDeletingItem(null)}
        onConfirm={() => {
          const { type, item } = deletingItem
          if (type === 'parcel') dispatch(deleteParcel({ id: item.id, ownerId: user.id }))
          else if (type === 'listing') dispatch(deleteListing({ id: item.id, ownerId: user.id }))
          else if (type === 'job') dispatch(deleteJob({ id: item.id, ownerId: user.id }))
          else if (type === 'event') dispatch(deleteEvent({ id: item.id, ownerId: user.id }))
          else if (type === 'video') dispatch(deleteVideo({ id: item.id, ownerId: user.id }))
          else if (type === 'post') dispatch(deletePost(item.id))
          else if (type === 'other') dispatch(deleteOffer({ id: item.id, ownerId: user.id }))
          setDeletingItem(null)
        }}
      />

      <BoostPublicationSheet
        open={Boolean(boostFlow.target)}
        entityType={boostFlow.target?.entityType}
        entityLabel={boostFlow.target?.label || ''}
        loading={boostFlow.loading}
        config={starsBalance?.config}
        onClose={boostFlow.closeBoost}
        onSelect={handleBoostSelect}
      />
      <StarsSpendConfirm
        open={Boolean(boostFlow.pendingQuote)}
        quote={boostFlow.pendingQuote}
        onCancel={boostFlow.cancelSpend}
        onConfirm={boostFlow.acceptSpend}
      />
    </div>
  )
}
