import { useMemo, useState } from 'react'
import { FiArrowLeft, FiEye, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { MyListingCard } from '../features/marketplace/MyListingCard'
import {
  deleteListing,
  duplicateListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import {
  groupListingsByType,
  isActiveListing,
  isArchivedListing,
} from '../features/marketplace/listingCatalogUtils'

export function MyListingsPage() {
  const dispatch = useDispatch()
  const [deleting, setDeleting] = useState(null)
  const [tab, setTab] = useState('active')
  const user = useSelector((state) => state.auth.user)
  const listings = useSelector((state) =>
    state.marketplace.items.filter((item) => item.ownerId === user.id),
  )

  const activeListings = useMemo(() => listings.filter(isActiveListing), [listings])
  const archivedListings = useMemo(() => listings.filter(isArchivedListing), [listings])
  const visibleListings = tab === 'active' ? activeListings : archivedListings
  const grouped = useMemo(() => groupListingsByType(visibleListings), [visibleListings])
  const totalViews = listings.reduce((sum, item) => sum + (Number(item.views) || 0), 0)

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Marketplace"
        title="Mes annonces"
        description="Gérez vos publications par catégorie — actives, archives, vues et actions."
        stats={[
          { label: 'Actives', value: activeListings.length },
          { label: 'Archives', value: archivedListings.length },
          { label: 'Vues totales', value: totalViews },
        ]}
        actions={
          <>
            <Link to={`/users/${user.id}/annonces`}>
              <Button variant="secondary" icon={FiEye}>
                Vue publique
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="secondary" icon={FiArrowLeft}>
                Marketplace
              </Button>
            </Link>
            <Link to="/marketplace/publish">
              <Button icon={FiPlus}>Publier</Button>
            </Link>
          </>
        }
      />

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
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{group.label}</h2>
                <p className="text-sm text-[var(--app-text-muted)]">
                  {group.items.length} annonce{group.items.length > 1 ? 's' : ''} dans cette catégorie
                </p>
              </div>
              <Badge tone="info">{group.label}</Badge>
            </div>
            <div className="grid gap-4">
              {group.items.map((listing) => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  ownerMode
                  showViews
                  onDuplicate={() => dispatch(duplicateListing({ listing, ownerId: user.id }))}
                  onRepublish={() =>
                    dispatch(updateListingStatus({ id: listing.id, status: 'active', actorId: user.id }))
                  }
                  onMarkSold={() =>
                    dispatch(updateListingStatus({ id: listing.id, status: 'sold', actorId: user.id }))
                  }
                  onArchive={() =>
                    dispatch(updateListingStatus({ id: listing.id, status: 'archived', actorId: user.id }))
                  }
                  onDelete={() => setDeleting(listing)}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          icon={FiShoppingBag}
          title={tab === 'active' ? 'Aucune annonce active' : 'Aucune archive'}
          description={
            tab === 'active'
              ? 'Publiez votre première annonce pour la retrouver ici.'
              : 'Les annonces archivées ou vendues apparaîtront dans cet onglet.'
          }
          action={
            tab === 'active' ? (
              <Link to="/marketplace/publish">
                <Button icon={FiPlus}>Publier une annonce</Button>
              </Link>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Supprimer cette annonce ?"
        description="Cette suppression locale est définitive et retire également ses signalements."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          dispatch(deleteListing({ id: deleting.id, ownerId: user.id }))
          setDeleting(null)
        }}
      />
    </div>
  )
}
