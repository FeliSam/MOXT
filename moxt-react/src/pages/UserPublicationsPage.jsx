import { useEffect, useMemo } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiLock,
  FiPackage,
  FiPlay,
  FiRepeat,
  FiShoppingBag,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, Navigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { canViewUserActivity } from '../features/account/activityVisibility'
import { useProfileActivityVisibility } from '../features/account/useProfileActivityVisibility'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
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
import { PublicationProfileCard } from '../features/publications/PublicationProfileCard'
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { usePublicationProfile } from '../features/publications/usePublicationProfile'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { ContactButton } from '../features/communications/ContactButton'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestUserPreview } from '../features/guest/useGuestPreview'
import { REVIEW_TARGET_TYPES, ReviewsSection } from '../features/reviews/ReviewsSection'
import { useScopedProfileReviews } from '../features/reviews/useScopedTargetReviews'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js'
import { useLanguage } from '../contexts/useLanguage'
import { phase3Text } from '../i18n/phase3I18n'

const EMPTY_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  video: FiPlay,
  post: FiFileText,
  other: FiRepeat,
}

export function UserPublicationsPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { userId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { guestMode = false } = useOutletContext() || {}
  const { requireAccount } = useGuestAction()
  const currentUser = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)
  const guestPreview = useGuestUserPreview(guestMode ? userId : null)
  const isOwner = !guestMode && currentUser?.id === userId

  const mainTab = searchParams.get('view') === 'avis' ? 'avis' : 'publications'
  const requestedArchiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'personal'
  const conversations = useSelector((state) => state.communications.conversations)
  const reduxOwnBusiness = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === userId),
  )
  const { visibility, loading: visibilityLoading } = useProfileActivityVisibility(
    guestMode ? null : userId,
    currentUser?.id,
  )
  const canView = guestMode
    ? !guestPreview.loading && !guestPreview.error && guestPreview.profile
    : canViewUserActivity({
        viewerId: currentUser?.id,
        ownerId: userId,
        visibility,
        conversations,
      })
  const ownBusiness = guestMode ? guestPreview.business : reduxOwnBusiness
  const guestPublications = guestPreview.publications
  const publications = useMemo(() => {
    if (guestMode) {
      return filterPublicationsByScope(
        guestPublications || {
          listings: [],
          parcels: [],
          jobs: [],
          events: [],
          videos: [],
          posts: [],
          others: [],
        },
        scope,
      )
    }
    return filterPublicationsByScope(collectUserPublications(appState, userId), scope)
  }, [appState, guestMode, guestPublications, scope, userId])
  const { profile: memberProfile } = usePublicationProfile(guestMode ? null : userId, currentUser)
  const guestProfile = guestPreview.profile
  const displayName = useMemo(() => {
    if (guestMode) {
      const remoteName = `${guestProfile?.firstName || ''} ${guestProfile?.lastName || ''}`.trim()
      return remoteName || phase3Text(t, 'publications.user.memberFallback')
    }
    const remoteName = `${memberProfile?.firstName || ''} ${memberProfile?.lastName || ''}`.trim()
    return remoteName || phase3Text(t, 'publications.user.memberFallback')
  }, [guestMode, guestProfile, memberProfile, t])
  const profile = useMemo(
    () => buildUserPublicationProfile(userId, publications, { displayName }),
    [displayName, publications, userId],
  )
  const typeTabSource = scope === 'business' ? BUSINESS_PUBLICATION_TYPE_TABS : PUBLICATION_TYPE_TABS
  const archiveCounts = useMemo(() => publicationArchiveCounts(publications), [publications])
  const archiveTab = preferredPublicationArchiveTab(publications, requestedArchiveTab)
  const typeCounts = useMemo(
    () => publicationTypeCounts(publications, archiveTab),
    [archiveTab, publications],
  )
  const visibleTypeTabs = useMemo(
    () => visiblePublicationTypeTabs(typeTabSource, typeCounts),
    [typeCounts, typeTabSource],
  )
  const visible = useMemo(
    () => filterPublicationsByTabs(publications, { archiveTab, typeTab }),
    [archiveTab, publications, typeTab],
  )
  const hasContent = visiblePublicationCount(visible) > 0
  const hasAnyPublication = publicationTotalCount(publications) > 0
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag
  const scopedReviews = useScopedProfileReviews(userId, publications, {
    enabled: Boolean(canView && !guestMode && userId),
  })
  const aggregateReviews = useMemo(() => {
    if (guestMode) {
      return filterAggregateReviews(guestPreview.reviews, {
        profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        profileTargetId: userId,
        publicationIds: collectPublicationTargetIds(publications),
      })
    }
    return scopedReviews.reviews
  }, [
    guestMode,
    guestPreview.reviews,
    publications,
    scopedReviews.reviews,
    userId,
  ])
  const aggregateRating = useMemo(() => {
    if (guestMode) return calculateAggregateRating(aggregateReviews)
    return scopedReviews.rating
  }, [aggregateReviews, guestMode, scopedReviews.rating])

  function setMainTab(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'publications') params.delete('view')
    else params.set('view', 'avis')
    setSearchParams(params, { replace: true })
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

  const hasArchives = archiveCounts.archived > 0
  const showArchives = hasArchives

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

  if (guestMode && guestPreview.loading) {
    return (
      <EmptyState
        title={p3('publications.user.preview.loading')}
        description={p3('publications.user.preview.loadingDescription')}
      />
    )
  }

  if (guestMode && guestPreview.error === 'not_found') {
    return (
      <EmptyState
        title={p3('publications.user.notFound.title')}
        description={p3('publications.user.notFound.description')}
        action={
          <Link to="/">
            <Button variant="secondary" icon={FiArrowLeft}>
              {p3('publications.user.backHome')}
            </Button>
          </Link>
        }
      />
    )
  }

  if (!isOwner && !guestMode && !visibilityLoading && !canView) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow={p3('publications.user.eyebrow')}
          title={p3('publications.user.title.default')}
          description={p3('publications.user.restricted.description')}
        />
        <EmptyState
          icon={FiLock}
          title={p3('publications.user.restricted.title')}
          description={p3('publications.user.restricted.memberDescription')}
          action={
            <Link to="/dashboard">
              <Button variant="secondary" icon={FiArrowLeft}>
                {p3('publications.user.back')}
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (guestMode && (guestPreview.error === 'private' || guestPreview.error === 'contacts')) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow={p3('publications.user.eyebrow')}
          title={p3('publications.user.title.default')}
          description={p3('publications.user.restricted.description')}
        />
        <EmptyState
          icon={FiLock}
          title={p3('publications.user.restricted.title')}
          description={p3('publications.user.restricted.guestDescription')}
          action={
            <Link to="/register">
              <Button>{p3('publications.user.createAccount')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleGuestInteract = () => requireAccount(p3('publications.user.guestAction'))

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip sm:gap-7">
      <PublicationProfileCard
        displayName={displayName}
        verified={Boolean(guestMode ? guestProfile?.verified : memberProfile?.verified)}
        memberSince={guestMode ? guestProfile?.memberSince : memberProfile?.memberSince}
        city={(guestMode ? guestProfile?.city : memberProfile?.city) || profile.city}
        country={(guestMode ? guestProfile?.country : memberProfile?.country) || profile.country}
        activeCount={profile.activeCount}
        archivedCount={profile.archivedCount}
        totalCount={profile.totalCount}
        totalViews={profile.totalViews}
        aggregateRating={aggregateRating}
        isOwner={isOwner}
        scope={scope}
        ownBusiness={ownBusiness}
        shareUserId={guestMode ? null : userId}
        avatarUrl={guestMode ? guestProfile?.avatarUrl : memberProfile?.avatarUrl}
        actions={
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-t border-[var(--app-border)] pt-4">
            {!isOwner ? (
              <ContactButton
                ownerId={userId}
                relatedEntity={{
                  name: displayName,
                  sellerName: displayName,
                  avatarUrl: guestMode ? guestProfile?.avatarUrl : memberProfile?.avatarUrl,
                }}
                relatedId={userId}
                relatedPath={`/users/${userId}/publications`}
                relatedTitle={displayName}
                relatedType="profile"
                iconOnly
                className="!size-11 shrink-0"
              />
            ) : ownBusiness && !guestMode ? (
              <div className="col-span-2 flex flex-wrap items-center gap-2">
                <PublicationScopeButton
                  business={ownBusiness}
                  isOwner={isOwner}
                  onScopeChange={setScope}
                  scope={scope}
                />
              </div>
            ) : null}
            {!isOwner && !guestMode ? (
              <SubscribeButton
                publisherType="user"
                publisherId={userId}
                publisherName={displayName}
                publisherPath={`/users/${userId}/publications`}
                className="min-w-0 w-full"
              />
            ) : null}
            {!isOwner && ownBusiness && !guestMode ? (
              <PublicationScopeButton
                business={ownBusiness}
                isOwner={false}
                onScopeChange={setScope}
                scope={scope}
                className="col-span-2 min-w-0"
              />
            ) : isOwner ? (
              <Link
                to={`/publications/mine${scope === 'business' ? '?scope=business' : ''}`}
                className="col-span-2 min-w-0"
              >
                <Button variant="secondary" icon={FiArrowLeft} className="w-full">
                  {p3('publications.user.manage')}
                </Button>
              </Link>
            ) : guestMode ? (
              <Link to="/discover" className="min-w-0">
                <Button variant="secondary" icon={FiArrowLeft} className="w-full">
                  {p3('publications.user.discover')}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <CatalogArchiveTabs
        active={mainTab}
        onChange={setMainTab}
        variant="section"
        tabs={[
          {
            key: 'publications',
            label: p3('publications.user.tabs.publications'),
            count: profile.totalCount,
          },
          {
            key: 'avis',
            label: p3('publications.user.tabs.reviews'),
            count: aggregateRating.count,
            alwaysShow: true,
          },
        ]}
      />

      {mainTab === 'publications' ? (
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
            showArchives={showArchives}
            activeLabel={p3('publications.mine.stats.active')}
            archivedLabel={p3('publications.mine.stats.archived')}
          />

          {!hasAnyPublication ? (
            <EmptyState
              icon={FiShoppingBag}
              title={p3('publications.user.empty.title')}
              description={p3('publications.user.empty.description')}
            />
          ) : hasContent ? (
            <div className="grid gap-6">
              {visible.listing.length ? (
                <CatalogGrid lazy={false}>
                  {visible.listing.map((listing) => (
                    <MarketplaceListingCard
                      key={listing.id}
                      listing={listing}
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
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
                      readOnly
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
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
                      readOnly
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
                    />
                  ))}
                  {visible.job.map((job) => (
                    <MyJobPublicationCard
                      key={job.id}
                      job={job}
                      readOnly
                      ownerDisplayName={displayName}
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
                    />
                  ))}
                  {visible.event.map((event) => (
                    <MyEventPublicationCard
                      key={event.id}
                      event={event}
                      readOnly
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
                    />
                  ))}
                  {(visible.video || []).map((video) => (
                    <MyVideoPublicationCard
                      key={video.id}
                      video={video}
                      readOnly
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
                    />
                  ))}
                  {visible.other.map((offer) => (
                    <MyP2POfferPublicationCard
                      key={offer.id}
                      offer={offer}
                      readOnly
                      guestMode={guestMode}
                      onGuestInteract={handleGuestInteract}
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
            />
          )}
        </div>
      ) : (
        <ReviewsSection
          embedded
          ownerId={userId}
          ownerName={displayName}
          profileTargetType={REVIEW_TARGET_TYPES.USER_PROFILE}
          profileTargetId={userId}
          reviews={aggregateReviews}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

/** Redirection legacy */
export function UserListingsRedirect() {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.toString()
  return <Navigate to={`/users/${userId}/publications${query ? `?${query}` : ''}`} replace />
}
