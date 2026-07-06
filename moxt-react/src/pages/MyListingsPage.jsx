import { useState } from 'react'
import {
  FiArchive,
  FiArrowLeft,
  FiCheckCircle,
  FiCopy,
  FiEdit2,
  FiRotateCcw,
  FiTrash2,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import {
  deleteListing,
  duplicateListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import { formatMoney } from '../features/transfers/transferUtils'

export function MyListingsPage() {
  const dispatch = useDispatch()
  const [deleting, setDeleting] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const listings = useSelector((state) =>
    state.marketplace.items.filter((item) => item.ownerId === user.id),
  )

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Marketplace"
        title="Mes annonces"
        description="Publiez, suspendez, archivez ou remettez en ligne vos contenus."
        actions={
          <>
            <Link
              to="/profile"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
            >
              <FiArrowLeft /> Retour
            </Link>
            <Link to="/marketplace">
              <Button>Explorer la marketplace</Button>
            </Link>
          </>
        }
      />
      {listings.length ? (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="h-full overflow-hidden">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <Link
                    className="w-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-[var(--app-surface-muted)] sm:w-28"
                    to={`/marketplace/${listing.id}`}
                  >
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-[180px] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-[180px] w-full place-items-center text-xs font-black text-[var(--app-text-muted)]">
                        MOXT
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="font-black hover:text-brand-700"
                        to={`/marketplace/${listing.id}`}
                      >
                        {listing.title}
                      </Link>
                      <Badge>{listing.status}</Badge>
                      <Badge tone="info">{listing.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                      {formatMoney(listing.price, listing.currency)} · {listing.views || 0} vues ·{' '}
                      {listing.favorites?.length || 0} favoris
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--app-text-muted)]">
                      {listing.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/marketplace/${listing.id}/edit`}>
                    <Button variant="secondary" icon={FiEdit2}>
                      Modifier
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    icon={FiCopy}
                    onClick={() => dispatch(duplicateListing({ listing, ownerId: user.id }))}
                  >
                    Dupliquer
                  </Button>
                  {listing.status !== 'active' ? (
                    <Button
                      icon={FiRotateCcw}
                      onClick={() =>
                        dispatch(
                          updateListingStatus({
                            id: listing.id,
                            status: 'active',
                            actorId: user.id,
                          }),
                        )
                      }
                    >
                      Republier
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      icon={FiCheckCircle}
                      onClick={() =>
                        dispatch(
                          updateListingStatus({
                            id: listing.id,
                            status: 'sold',
                            actorId: user.id,
                          }),
                        )
                      }
                    >
                      Marquer vendu
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    icon={FiArchive}
                    onClick={() =>
                      dispatch(
                        updateListingStatus({
                          id: listing.id,
                          status: 'archived',
                          actorId: user.id,
                        }),
                      )
                    }
                  >
                    Archiver
                  </Button>
                  <Button variant="danger" icon={FiTrash2} onClick={() => setDeleting(listing)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune annonce personnelle"
          description="Votre première publication apparaîtra ici."
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
