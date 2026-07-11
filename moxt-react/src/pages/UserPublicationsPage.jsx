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
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { PillBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { canViewUserActivity } from '../features/account/activityVisibility'
import { useProfileActivityVisibility } from '../features/account/useProfileActivityVisibility'
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
import {
  REVIEW_TARGET_TYPES,
  ReviewsSection,
} from '../features/reviews/ReviewsSection'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
} from '@moxt/shared/utils/reviewUtils.js'

const EMPTY_ICONS = {
  listing: FiShoppingBag,
  parcel: FiPackage,
  job: FiBriefcase,
  event: FiCalendar,
  post: FiFileText,
  other: FiFileText,
}


export function UserPublicationsPage() {
  const { userId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)

  const mainTab = searchParams.get('view') === 'avis' ? 'avis' : 'publications'
  const archiveTab = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const typeTab = PUBLICATION_TYPE_TABS.some((tab) => tab.id === searchParams.get('type'))
    ? searchParams.get('type')
    : 'listing'

  const isOwner = currentUser?.id === userId
  const conversations = useSelector((state) => state.communications.conversations)
  const { visibility, loading: visibilityLoading } = useProfileActivityVisibility(
    userId,
    currentUser?.id,
  )
  const canView = canViewUserActivity({
    viewerId: currentUser?.id,
    ownerId: userId,
    visibility,
    conversations,
  })
  const ownBusiness = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === userId),
  )
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'personal'
  const publications = useMemo(
    () => filterPublicationsByScope(collectUserPublications(appState, userId), scope),
    [appState, scope, userId],
  )
  const { profile: memberProfile } = usePublicationProfile(userId, currentUser)
  const displayName = useMemo(() => {
    const remoteName = `${memberProfile?.firstName || ''} ${memberProfile?.lastName || ''}`.trim()
    return remoteName || 'Membre MOXT'
  }, [memberProfile])
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
  const aggregateReviews = useMemo(
    () =>
      filterAggregateReviews(appState.reviews?.items || [], {
        profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        profileTargetId: userId,
        publicationIds: collectPublicationTargetIds(publications),
      }),
    [appState.reviews?.items, publications, userId],
  )
  const aggregateRating = useMemo(
    () => calculateAggregateRating(aggregateReviews),
    [aggregateReviews],
  )

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

  if (!isOwner && !visibilityLoading && !canView) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow="Communauté"
          title="Publications du membre"
          description="Ce membre a restreint la visibilité de son activité."
        />
        <EmptyState
          icon={FiLock}
          title="Profil non accessible"
          description="Seuls les contacts autorisés ou le membre lui-même peuvent consulter ces publications."
          action={
            <Link to="/dashboard">
              <Button variant="secondary" icon={FiArrowLeft}>
                Retour
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  const pageDescription = isOwner
    ? scope === 'business' && ownBusiness
      ? `Vue publique des publications de ${ownBusiness.name}.`
      : 'Vue publique de vos publications personnelles — partagez ce profil avec la communauté.'
    : scope === 'business' && ownBusiness
      ? `Publications publiées par ${ownBusiness.name}.`
      : hasAnyPublication
        ? 'Annonces, colis, jobs, événements et publications du profil personnel.'
        : "Consultez les publications et les avis laissés sur ce membre."

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title={isOwner ? 'Mes publications publiques' : `Publications de ${displayName}`}
        description={pageDescription}
        actions={
          <>
            {!isOwner ? (
              <SubscribeButton
                publisherType="user"
                publisherId={userId}
                publisherName={displayName}
                publisherPath={`/users/${userId}/publications`}
              />
            ) : null}
            {ownBusiness ? (
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
                  Gérer mes publications
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <Button variant="secondary" icon={FiArrowLeft}>
                  Retour
                </Button>
              </Link>
            )}
          </>
        }
      />

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
        isOwner={isOwner}
        scope={scope}
        ownBusiness={ownBusiness}
      />

      <CatalogArchiveTabs
        active={mainTab}
        onChange={setMainTab}
        variant="section"
        tabs={[
          { key: 'publications', label: 'Publications', count: profile.totalCount },
          { key: 'avis', label: 'Avis', count: aggregateRating.count },
        ]}
      />

      {mainTab === 'publications' ? (
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

          {!hasAnyPublication ? (
            <EmptyState
              icon={FiShoppingBag}
              title="Aucune publication"
              description="Les annonces, colis, jobs, événements et publications de ce membre apparaîtront ici."
            />
          ) : hasContent ? (
            <div className="grid gap-4">
              {visible.listing.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  ownerMode={false}
                  showViews={isOwner}
                />
              ))}
              {visible.parcel.map((parcel) => (
                <MyParcelPublicationCard key={parcel.id} parcel={parcel} readOnly />
              ))}
              {visible.job.map((job) => (
                <MyJobPublicationCard
                  key={job.id}
                  job={job}
                  readOnly
                  ownerDisplayName={displayName}
                />
              ))}
              {visible.event.map((event) => (
                <MyEventPublicationCard key={event.id} event={event} readOnly />
              ))}
              {visible.post.map((post) => (
                <MyPostPublicationCard key={post.id} post={post} readOnly />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={archiveTab === 'archived' ? FiArchive : EmptyIcon}
              title={archiveTab === 'active' ? 'Aucune publication active' : 'Aucune archive'}
              description={`Aucun contenu dans ${PUBLICATION_TYPE_TABS.find((t) => t.id === typeTab)?.label || 'cette catégorie'}.`}
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
