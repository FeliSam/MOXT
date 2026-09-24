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
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Tabs } from '../components/ui/Tabs'
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
import { selectPublisherSubscribers, selectUserSubscriptions } from '../features/account/subscriptionSelectors'
import {
  removePublisherSubscription,
  selectAccountPreferences,
  updatePublisherSubscriptionPref,
} from '../features/account/accountSlice'
import { SubscriptionsFollowingPanel } from '../features/account/SubscriptionsFollowingPanel'
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
  preferredPublicationArchiveTab,
  visiblePublicationCount,
  visiblePublicationTypeTabs,
} from '../features/publications/publicationCatalogUtils'
import { PublicationCatalogNav } from '../features/publications/PublicationCatalogNav'
import { PublicProfileHero } from '../features/publications/PublicProfileHero'
import { PublicProfileTabs } from '../features/publications/PublicProfileTabs'
import { PublicVideoThumbGrid } from '../features/publications/PublicVideoThumbGrid'
import { CoverStylePicker } from '../features/publications/coverBanners/CoverStylePicker'
import { useOwnerCoverStyleEdit } from '../features/publications/coverBanners/useOwnerCoverStyleEdit'
import {
  defaultCoverStyleForPersonal,
} from '../features/publications/coverBanners/coverBannerCatalog'
import { isActiveVideo } from '../features/videos/videoUtils'
import { activityByValue } from '../config/businessActivities'
import { ProfileQrShareButton } from '../features/share/ProfileQrShareButton'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../features/share/businessShareUtils'
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { usePublicationProfile } from '../features/publications/usePublicationProfile'
import { SubscribersPanel } from '../features/account/SubscribersPanel'
import { canRepublishBusinessItem, isBusinessPublishReady } from '../features/businesses/businessPublishUtils'
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
  const preferences = useSelector((state) => selectAccountPreferences(state, user?.id))

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

  const requestedArchiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const rawPanel = searchParams.get('panel')
  const panel =
    rawPanel === 'subscriptions' || rawPanel === 'subscribers' ? 'subscriptions' : 'publications'
  const subscriptionSub =
    searchParams.get('sub') === 'subscribers' || rawPanel === 'subscribers'
      ? 'subscribers'
      : 'following'
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
    () => publicationArchiveCounts(publications, { includePending: true }),
    [publications],
  )
  const archiveTab = preferredPublicationArchiveTab(publications, requestedArchiveTab, {
    includePending: true,
  })
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
  const subscriptions = useSelector((state) => selectUserSubscriptions(state, user.id))
  const subscriptionsCount = subscriptions.length + subscriberCount

  const activeVideos = (publications.videos || []).filter(isActiveVideo)
  const coverEditCategory = scope === 'business' ? 'business' : 'personal'
  const coverEdit = useOwnerCoverStyleEdit({
    category: coverEditCategory,
    business: coverEditCategory === 'business' ? ownBusiness : null,
    userId: coverEditCategory === 'personal' ? user.id : null,
    gender: memberProfile?.gender || user?.gender,
    coverStyle:
      coverEditCategory === 'business'
        ? ownBusiness?.coverStyle
        : preferences?.coverStyle || defaultCoverStyleForPersonal(memberProfile?.gender || user?.gender),
  })
  const showCoverEdit =
    coverEditCategory === 'personal' || (coverEditCategory === 'business' && !ownBusiness?.bannerUrl)
  const isBusinessScope = scope === 'business' && Boolean(ownBusiness)
  const heroName = isBusinessScope ? ownBusiness.name : displayName
  const heroVerified = isBusinessScope
    ? isBusinessPublishReady(ownBusiness)
    : Boolean(memberProfile?.verified)
  const heroCategory = isBusinessScope
    ? activityByValue(ownBusiness.primaryActivity)?.label || ownBusiness.sector
    : undefined
  const heroCity = isBusinessScope
    ? businessCityLabel(ownBusiness) || ownBusiness.city
    : memberProfile?.city || profile.city
  const heroCoverUrl = isBusinessScope ? ownBusiness.bannerUrl || '' : ''
  const heroAvatarUrl = isBusinessScope
    ? ownBusiness.logoUrl
    : memberProfile?.avatarUrl
  const defaultMainTab = activeVideos.length > 0 ? 'videos' : 'publications'


  useEffect(() => {
    if (rawPanel !== 'subscribers') return
    const params = new URLSearchParams(searchParams)
    params.set('panel', 'subscriptions')
    params.set('sub', 'subscribers')
    setSearchParams(params, { replace: true })
  }, [rawPanel, searchParams, setSearchParams])

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
    if (archiveTab === requestedArchiveTab) return
    setArchiveTab(archiveTab)
  }, [archiveTab, requestedArchiveTab])

  function setScope(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'personal') params.delete('scope')
    else params.set('scope', next)
    setSearchParams(params, { replace: true })
  }

  function setPanel(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'publications') {
      params.delete('panel')
      params.delete('sub')
    } else {
      params.set('panel', 'subscriptions')
      if (!params.get('sub')) params.set('sub', 'following')
    }
    setSearchParams(params, { replace: true })
  }

  function setSubscriptionSub(next) {
    const params = new URLSearchParams(searchParams)
    params.set('panel', 'subscriptions')
    if (next === 'following') params.delete('sub')
    else params.set('sub', next)
    setSearchParams(params, { replace: true })
  }

  const publishLink = PUBLISH_LINKS[typeTab] || PUBLISH_LINKS.listing
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag

  const viewParam = searchParams.get('view')
  const mainView =
    panel === 'subscriptions'
      ? 'subscriptions'
      : viewParam === 'videos' || viewParam === 'publications'
        ? viewParam
        : defaultMainTab

  function setMainView(next) {
    if (next === 'subscriptions') {
      setPanel('subscriptions')
      return
    }
    const params = new URLSearchParams(searchParams)
    params.delete('panel')
    params.delete('sub')
    if (next === defaultMainTab) params.delete('view')
    else params.set('view', next)
    setSearchParams(params, { replace: true })
  }

  const videosTab = {
    key: 'videos',
    label: p3('publications.user.tabs.videos'),
    count: activeVideos.length,
    alwaysShow: true,
  }
  const publicationsTab = {
    key: 'publications',
    label:
      scope === 'business'
        ? p3('publications.user.tabs.products')
        : p3('publications.mine.tabs.publications'),
    count: profile.totalCount,
    alwaysShow: true,
  }
  const mineTabs = [
    ...(activeVideos.length > 0 ? [videosTab, publicationsTab] : [publicationsTab, videosTab]),
    {
      key: 'subscriptions',
      label: p3('publications.mine.tabs.subscriptions'),
      count: subscriptionsCount,
      alwaysShow: true,
    },
  ]

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip sm:gap-6">
      <PublicProfileHero
        name={heroName}
        verified={heroVerified}
        category={heroCategory}
        city={heroCity}
        coverUrl={heroCoverUrl}
        avatarUrl={heroAvatarUrl}
        coverCategory={isBusinessScope ? 'business' : 'personal'}
        coverStyle={
          isBusinessScope
            ? ownBusiness?.coverStyle
            : preferences?.coverStyle || defaultCoverStyleForPersonal(memberProfile?.gender || user?.gender)
        }
        gender={memberProfile?.gender || user?.gender}
        emptyCoverVariant={isBusinessScope ? 'editorial-dark' : 'gradient'}
        rating={aggregateRating}
        reviewsLabel={p3('publications.public.reviewsShort')}
        showCoverEdit={showCoverEdit}
        onEditCover={coverEdit.openEditor}
        editCoverLabel={t('profile.personal.editBanner')}
        shareSlot={
          <ProfileQrShareButton
            type={isBusinessScope ? 'business' : 'user'}
            activityVisibility={isBusinessScope ? ownBusiness?.activityVisibility : undefined}
            targetPath={
              isBusinessScope ? undefined : `/users/${user.id}/publications`
            }
            refreshKey={isBusinessScope ? businessShareVersion(ownBusiness) : undefined}
            shareUrl={isBusinessScope ? buildBusinessShareUrl(ownBusiness) : undefined}
            shareText={isBusinessScope ? buildBusinessShareText(ownBusiness) : undefined}
            title={heroName}
            subtitle={isBusinessScope ? heroCategory : displayName}
            verified={heroVerified}
            city={heroCity}
            sector={isBusinessScope ? heroCategory : undefined}
            logoUrl={heroAvatarUrl}
          />
        }
        actions={
          <>
            <PublicationScopeButton
              business={ownBusiness}
              onScopeChange={setScope}
              scope={scope}
              className="col-span-2 min-w-0 sm:col-span-1"
            />
            <Link
              to={`/users/${user.id}/publications${scope === 'business' ? '?scope=business' : ''}`}
              className="min-w-0"
            >
              <Button variant="secondary" icon={FiEye} className="w-full">
                {p3('publications.mine.publicView')}
              </Button>
            </Link>
            <Link to={publishLink.to} className="col-span-2 min-w-0 sm:col-span-1">
              <Button icon={FiPlus} className="w-full">
                {p3(publishLink.labelKey)}
              </Button>
            </Link>
          </>
        }
      />

      <PublicProfileTabs active={mainView} onChange={setMainView} tabs={mineTabs} />

      {mainView === 'subscriptions' ? (
        <div className="grid gap-4">
          <Tabs
            items={[
              { value: 'following', label: p3('subscriptions.tabs.subscriptions') },
              { value: 'subscribers', label: p3('subscriptions.tabs.subscribers') },
            ]}
            active={subscriptionSub}
            onChange={setSubscriptionSub}
            label={p3('publications.mine.subscriptionsMenuLabel')}
          />

          {subscriptionSub === 'following' ? (
            <SubscriptionsFollowingPanel
              subscriptions={subscriptions}
              onPrefChange={(item, notifyPref) =>
                dispatch(
                  updatePublisherSubscriptionPref({
                    userId: user.id,
                    publisherType: item.publisherType,
                    publisherId: item.publisherId,
                    notifyPref,
                  }),
                )
              }
              onUnsubscribe={(item) =>
                dispatch(
                  removePublisherSubscription({
                    userId: user.id,
                    publisherType: item.publisherType,
                    publisherId: item.publisherId,
                  }),
                )
              }
            />
          ) : (
            <SubscribersPanel
              publisherType={subscriberPublisherType}
              publisherId={subscriberPublisherId}
              publisherName={subscriberPublisherName}
              publisherPath={subscriberPublisherPath}
            />
          )}
        </div>
      ) : mainView === 'videos' ? (
        <PublicVideoThumbGrid
          videos={activeVideos}
          title={p3('publications.public.videosTitle')}
          emptyTitle={p3('publications.public.videosEmpty')}
          emptyDescription={p3('publications.public.videosEmptyDescription')}
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


      <CoverStylePicker
        open={coverEdit.open}
        onClose={coverEdit.closeEditor}
        category={coverEdit.category}
        value={coverEdit.value}
        gender={coverEdit.gender}
        onChange={coverEdit.onChange}
        labels={coverEdit.labels}
        title={t('profile.personal.coverStyleTitle')}
        hint={t('profile.personal.coverStyleHint')}
        applyLabel={t('profile.personal.coverStyleApply')}
        manLabel={t('profile.personal.coverStyleMan')}
        womanLabel={t('profile.personal.coverStyleWoman')}
        activeLabel={t('profile.personal.coverStyleActive')}
      />

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
