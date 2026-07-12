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
      return remoteName || 'Membre MOXT'
    }
    const remoteName = `${memberProfile?.firstName || ''} ${memberProfile?.lastName || ''}`.trim()
    return remoteName || 'Membre MOXT'
  }, [guestMode, guestProfile, memberProfile])
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
        title="Chargement de l'aperçu"
        description="Récupération des publications publiques de ce membre..."
      />
    )
  }

  if (guestMode && guestPreview.error === 'not_found') {
    return (
      <EmptyState
        title="Profil introuvable"
        description="Ce membre MOXT n'existe pas ou n'est plus disponible."
        action={
          <Link to="/">
            <Button variant="secondary" icon={FiArrowLeft}>
              Retour à l'accueil
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

  if (guestMode && (guestPreview.error === 'private' || guestPreview.error === 'contacts')) {
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
          description="Créez un compte MOXT pour demander l'accès ou découvrir d'autres membres."
          action={
            <Link to="/register">
              <Button>Créer un compte</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleGuestInteract = () => requireAccount('consulter ce contenu')

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
          <div className="relative z-30 flex min-w-0 flex-wrap items-center justify-end gap-2">
            {!isOwner && !guestMode ? (
              <SubscribeButton
                className="relative z-30"
                publisherType="user"
                publisherId={userId}
                publisherName={displayName}
                publisherPath={`/users/${userId}/publications`}
              />
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
                  Gérer mes publications
                </Button>
              </Link>
            ) : guestMode ? (
              <Link to="/discover">
                <Button variant="secondary" icon={FiArrowLeft}>
                  Découvrir MOXT
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <Button variant="secondary" icon={FiArrowLeft}>
                  Retour
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
