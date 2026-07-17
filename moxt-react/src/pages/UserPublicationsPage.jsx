import { useMemo } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiLock,
  FiPackage,
  FiShoppingBag,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, Navigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { PillBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { canViewUserActivity } from '../features/account/activityVisibility'
import { useProfileActivityVisibility } from '../features/account/useProfileActivityVisibility'
import { matchUserId } from '../features/businesses/businessVisibility'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  MyEventPublicationCard,
  MyJobPublicationCard,
  MyPostPublicationCard,
  MyParcelPublicationCard,
} from '../features/publications/MyPublicationCards'
import {
  buildUserPublicationProfile,
  collectUserPublications,
  filterPublicationsByScope,
  filterPublicationsByTabs,
  PUBLICATION_TYPE_TABS,
  publicationArchiveCounts,
  publicationTotalCount,
  publicationTypeCounts,
  visiblePublicationCount,
} from '../features/publications/publicationCatalogUtils'
import { PublicationProfileCard } from '../features/publications/PublicationProfileCard'
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { usePublicationProfile } from '../features/publications/usePublicationProfile'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { ContactButton } from '../features/communications/ContactButton'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestUserPreview } from '../features/guest/useGuestPreview'
import {
  REVIEW_TARGET_TYPES,
  ReviewsSection,
} from '../features/reviews/ReviewsSection'
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
  post: FiFileText,
  other: FiFileText,
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

  const mainTab = searchParams.get('view') === 'avis' ? 'avis' : 'publications'
  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'personal'

  const isOwner = !guestMode && currentUser?.id === userId
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
  const hasAnyPublication = publicationTotalCount(publications) > 0
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag
  const aggregateReviews = useMemo(() => {
    const source = guestMode ? guestPreview.reviews : appState.reviews?.items || []
    return filterAggregateReviews(source, {
      profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: userId,
      publicationIds: collectPublicationTargetIds(publications),
    })
  }, [appState.reviews?.items, guestMode, guestPreview.reviews, publications, userId])
  const aggregateRating = useMemo(
    () => calculateAggregateRating(aggregateReviews),
    [aggregateReviews],
  )

  if (currentUser && matchUserId(userId, currentUser.id)) {
    return <Navigate to="/profile" replace />
  }

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

  const pageDescription = isOwner
    ? scope === 'business' && ownBusiness
      ? p3('publications.user.description.ownerBusiness', { name: ownBusiness.name })
      : p3('publications.user.description.ownerPersonal')
    : scope === 'business' && ownBusiness
      ? p3('publications.user.description.business', { name: ownBusiness.name })
      : hasAnyPublication
        ? p3('publications.user.description.personal')
        : p3('publications.user.description.noPublications')

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('publications.user.eyebrow')}
        title={
          isOwner
            ? p3('publications.user.title.owner')
            : p3('publications.user.title.member', { name: displayName })
        }
        description={pageDescription}
        actions={
          <div className="relative z-30 flex min-w-0 flex-wrap items-center justify-end gap-2">
            {!isOwner && !guestMode ? (
              <>
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
                />
                <SubscribeButton
                  className="relative z-30"
                  publisherType="user"
                  publisherId={userId}
                  publisherName={displayName}
                  publisherPath={`/users/${userId}/publications`}
                />
              </>
            ) : null}
            {ownBusiness && !guestMode ? (
              <PublicationScopeButton
                business={ownBusiness}
                isOwner={isOwner}
                onScopeChange={setScope}
                scope={scope}
              />
            ) : null}
            {isOwner ? (
              <Link
                to={
                  `/publications/mine${scope === 'business' ? '?scope=business' : ''}`
                }
              >
                <Button variant="secondary" icon={FiArrowLeft}>
                  {p3('publications.user.manage')}
                </Button>
              </Link>
            ) : guestMode ? (
              <Link to="/discover">
                <Button variant="secondary" icon={FiArrowLeft}>
                  {p3('publications.user.discover')}
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <Button variant="secondary" icon={FiArrowLeft}>
                  {p3('publications.user.back')}
                </Button>
              </Link>
            )}
          </div>
        }
      />

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
        contactOwnerId={!isOwner && !guestMode ? userId : null}
        contactPath={`/users/${userId}/publications`}
        contactTitle={displayName}
        contactEntity={{
          name: displayName,
          sellerName: displayName,
          avatarUrl: guestMode ? guestProfile?.avatarUrl : memberProfile?.avatarUrl,
        }}
        contactType="profile"
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
          },
        ]}
      />

      {mainTab === 'publications' ? (
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

          {!hasAnyPublication ? (
            <EmptyState
              icon={FiShoppingBag}
              title={p3('publications.user.empty.title')}
              description={p3('publications.user.empty.description')}
            />
          ) : hasContent ? (
            <div className="grid gap-4">
              {visible.listing.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  ownerMode={false}
                  showViews={isOwner}
                  guestMode={guestMode}
                  onGuestInteract={handleGuestInteract}
                />
              ))}
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
              {visible.post.map((post) => (
                <MyPostPublicationCard
                  key={post.id}
                  post={post}
                  readOnly
                  guestMode={guestMode}
                  onGuestInteract={handleGuestInteract}
                />
              ))}
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
  return (
    <Navigate
      to={`/users/${userId}/publications${query ? `?${query}` : ''}`}
      replace
    />
  )
}
