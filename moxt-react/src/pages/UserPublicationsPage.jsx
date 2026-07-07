import { useMemo, useState } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiEye,
  FiMapPin,
  FiPlus,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  buildPublisherProfile,
  groupListingsByType,
  isActiveListing,
  isArchivedListing,
} from '../features/marketplace/listingCatalogUtils'

export function UserPublicationsPage() {
  const { userId } = useParams()
  const currentUser = useSelector((state) => state.auth.user)
  const listings = useSelector((state) =>
    state.marketplace.items.filter((item) => item.ownerId === userId && !item.businessId),
  )
  const [tab, setTab] = useState('active')

  const isOwner = currentUser?.id === userId
  const profile = useMemo(() => buildPublisherProfile(userId, listings), [listings, userId])

  const activeListings = useMemo(() => listings.filter(isActiveListing), [listings])
  const archivedListings = useMemo(() => listings.filter(isArchivedListing), [listings])
  const visibleListings = tab === 'active' ? activeListings : archivedListings
  const grouped = useMemo(() => groupListingsByType(visibleListings), [visibleListings])

  if (!listings.length) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow="Marketplace"
          title="Annonces du membre"
          description="Ce membre n'a pas encore publié d'annonce visible."
          actions={
            <Link to="/marketplace">
              <Button variant="secondary" icon={FiArrowLeft}>
                Retour
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={FiShoppingBag}
          title="Aucune annonce"
          description="Les publications de ce membre apparaîtront ici."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Marketplace"
        title={isOwner ? 'Mes annonces publiques' : `Annonces de ${profile.name}`}
        description={
          isOwner
            ? 'Vue publique de vos annonces — partagez ce profil avec la communauté.'
            : "Découvrez les annonces actives et l'historique publié par ce membre."
        }
        actions={
          <>
            <Link to={isOwner ? '/publications/mine?type=listing' : '/marketplace'}>
              <Button variant="secondary" icon={FiArrowLeft}>
                {isOwner ? 'Gérer mes publications' : 'Marketplace'}
              </Button>
            </Link>
            {isOwner ? (
              <Link to="/marketplace/publish">
                <Button icon={FiPlus}>Publier</Button>
              </Link>
            ) : null}
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
                Vendeur
              </Badge>
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
              {isOwner ? (
                <Badge tone="warning">
                  <FiEye className="mr-1 inline" />
                  {profile.totalViews} vues au total
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <CatalogArchiveTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'active', label: 'Actives', count: activeListings.length },
          { key: 'archived', label: 'Archives', count: archivedListings.length },
        ]}
      />

      {grouped.length ? (
        grouped.map((group) => (
          <section key={group.type} className="grid gap-4">
            <div>
              <h3 className="text-base font-black">{group.label}</h3>
              <p className="text-sm text-[var(--app-text-muted)]">
                {group.items.length} annonce{group.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid gap-4">
              {group.items.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  ownerMode={false}
                  showViews={isOwner}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          icon={FiArchive}
          title={tab === 'active' ? 'Aucune annonce active' : 'Aucune archive'}
          description={
            tab === 'active'
              ? "Les annonces actives de ce membre s'afficheront ici."
              : 'Les annonces archivées ou vendues apparaîtront ici.'
          }
        />
      )}
    </div>
  )
}
