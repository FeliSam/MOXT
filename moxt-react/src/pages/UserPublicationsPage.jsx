import { useMemo } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiFileText,
  FiLock,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge, PillBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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
import { PublicationScopeButton } from '../features/publications/PublicationScopeButton'
import { SubscribeButton } from '../features/account/SubscribeButton'

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
  const scope = searchParams.get('scope') === 'business' ? 'business' : 'all'
  const publications = useMemo(
    () => filterPublicationsByScope(collectUserPublications(appState, userId), scope),
    [appState, scope, userId],
  )
  const profile = useMemo(
    () => buildUserPublicationProfile(userId, publications),
    [publications, userId],
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
  const EmptyIcon = EMPTY_ICONS[typeTab] || FiShoppingBag

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

  if (!publicationTotalCount(publications)) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow="Communauté"
          title={isOwner ? 'Mes publications publiques' : 'Publications du membre'}
          description="Ce membre n'a pas encore publié de contenu visible."
          actions={
            <Link
              to={
                isOwner
                  ? `/publications/mine${scope === 'business' ? '?scope=business' : ''}`
                  : '/dashboard'
              }
            >
              <Button variant="secondary" icon={FiArrowLeft}>
                {isOwner ? 'Gérer mes publications' : 'Retour'}
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={FiShoppingBag}
          title="Aucune publication"
          description="Les annonces, colis, jobs, événements et publications de ce membre apparaîtront ici."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title={isOwner ? 'Mes publications publiques' : `Publications de ${profile.name}`}
        description={
          isOwner
            ? scope === 'business' && ownBusiness
              ? `Vue publique des publications de ${ownBusiness.name}.`
              : 'Vue publique de tout votre contenu — partagez ce profil avec la communauté.'
            : 'Annonces, colis, jobs, événements et publications publiées par ce membre.'
        }
        actions={
          <>
            {!isOwner ? (
              <SubscribeButton
                publisherType="user"
                publisherId={userId}
                publisherName={profile.name}
                publisherPath={`/users/${userId}/publications`}
              />
            ) : null}
            {isOwner ? (
              <PublicationScopeButton
                business={ownBusiness}
                onScopeChange={setScope}
                scope={scope}
              />
            ) : null}
            <Link
              to={
                isOwner
                  ? `/publications/mine${scope === 'business' ? '?scope=business' : ''}`
                  : '/dashboard'
              }
            >
              <Button variant="secondary" icon={FiArrowLeft}>
                {isOwner ? 'Gérer mes publications' : 'Retour'}
              </Button>
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
          <span className="grid size-16 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-2xl font-black text-[var(--app-accent)]">
            {profile.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{profile.name}</h2>
              <Badge tone="success">
                <FiUser className="mr-1 inline" />
                Membre
              </Badge>
              {scope === 'business' && ownBusiness ? (
                <Badge tone="info">
                  <FiBriefcase className="mr-1 inline" />
                  {ownBusiness.name}
                </Badge>
              ) : null}
            </div>
            {profile.city ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-[var(--app-text-muted)]">
                <FiMapPin />
                {profile.city}
                {profile.country ? ` · ${profile.country}` : ''}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="success">{profile.activeCount} actives</Badge>
              <Badge tone="info">{profile.archivedCount} archivées</Badge>
              <Badge tone="warning">{profile.totalCount} au total</Badge>
              {isOwner ? (
                <Badge tone="warning">
                  <FiEye className="mr-1 inline" />
                  {profile.totalViews} vues annonces
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

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
              ownerMode={false}
              showViews={isOwner}
            />
          ))}
          {visible.parcel.map((parcel) => (
            <MyParcelPublicationCard key={parcel.id} parcel={parcel} readOnly />
          ))}
          {visible.job.map((job) => (
            <MyJobPublicationCard key={job.id} job={job} readOnly />
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
