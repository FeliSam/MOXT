import {
  FiArchive,
  FiCheckCircle,
  FiCopy,
  FiEdit2,
  FiEye,
  FiExternalLink,
  FiHeart,
  FiMapPin,
  FiRotateCcw,
  FiShoppingBag,
  FiTrash2,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FavoriteButton } from '../../components/ui/FavoriteButton'
import { statusMeta } from '../../config/statuses'
import { toggleAccountFavorite } from '../account/accountSlice'
import { buildListingFavoriteSnapshot } from '../account/favoriteUtils'
import { formatMoney } from '../transfers/transferUtils'
import { isActiveListing, listingCategoryLabel, listingTypeLabel } from './listingCatalogUtils'
import { archivedPublicationCardClass } from '../publications/publicationCatalogUtils'

export function MyListingCard({
  listing,
  ownerMode = true,
  showViews = true,
  onDuplicate,
  onRepublish,
  onMarkSold,
  onArchive,
  onDelete,
}) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const liked = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user?.id && item.relatedType === 'listing' && item.relatedId === listing.id,
    ),
  )
  const status = statusMeta(listing.status)
  const active = isActiveListing(listing)
  const typeLabel = listingTypeLabel(listing.type)
  const categoryLabel = listingCategoryLabel(listing.type, listing.category)
  const detailPath = `/marketplace/${listing.id}`

  function handleToggleLike(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!user) return
    dispatch(
      toggleAccountFavorite({
        userId: user.id,
        relatedType: 'listing',
        relatedId: listing.id,
        title: listing.title,
        path: detailPath,
        snapshot: buildListingFavoriteSnapshot(listing),
      }),
    )
  }

  return (
    <Card className={`overflow-visible p-0 ${active ? '' : archivedPublicationCardClass}`}>
      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          className={`relative h-48 w-full shrink-0 overflow-hidden rounded-t-[inherit] bg-gradient-to-br from-cyan-700 to-blue-600 lg:h-auto lg:w-56 lg:rounded-l-[inherit] lg:rounded-tr-none ${
            active ? '' : 'opacity-75 saturate-[0.85]'
          }`}
        >
          <Link className="absolute inset-0 block" to={detailPath}>
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full min-h-[12rem] w-full place-items-center text-white">
                <FiShoppingBag className="text-4xl opacity-90" />
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1">
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone="info">{typeLabel}</Badge>
            </div>
          </Link>

          {!ownerMode && active ? (
            <FavoriteButton
              active={liked}
              onToggle={handleToggleLike}
              className="!absolute !right-2.5 !top-2.5 z-30"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="line-clamp-2 text-lg font-black hover:text-brand-700"
                  to={detailPath}
                >
                  {listing.title}
                </Link>
                {categoryLabel ? (
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
                    {categoryLabel}
                  </p>
                ) : null}
              </div>
              <strong className="shrink-0 text-lg font-black text-brand-700">
                {listing.price ? formatMoney(listing.price, listing.currency) : 'Sur devis'}
              </strong>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--app-text-muted)]">
              {listing.city ? (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin className="shrink-0" />
                  {listing.city}
                </span>
              ) : null}
              {showViews ? (
                <span className="inline-flex items-center gap-1">
                  <FiEye className="shrink-0" />
                  {listing.views || 0} vues
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <FiHeart className="shrink-0" />
                {listing.favorites?.length || 0} favoris
              </span>
            </div>
            {listing.description ? (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--app-text-muted)]">
                {listing.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={detailPath}>
              <Button variant="secondary" icon={FiExternalLink} size="sm">
                {active ? 'Voir la fiche' : 'Consulter'}
              </Button>
            </Link>
            {ownerMode ? (
              <>
                <Link to={`/marketplace/${listing.id}/edit`}>
                  <Button variant="secondary" icon={FiEdit2} size="sm">
                    Modifier
                  </Button>
                </Link>
                <Button variant="secondary" icon={FiCopy} size="sm" onClick={onDuplicate}>
                  Dupliquer
                </Button>
                {!active ? (
                  <Button icon={FiRotateCcw} size="sm" onClick={onRepublish}>
                    Republier
                  </Button>
                ) : (
                  <Button variant="secondary" icon={FiCheckCircle} size="sm" onClick={onMarkSold}>
                    Marquer vendu
                  </Button>
                )}
                <Button variant="danger" icon={FiArchive} size="sm" onClick={onArchive}>
                  Archiver
                </Button>
                <Button variant="danger" icon={FiTrash2} size="sm" onClick={onDelete}>
                  Supprimer
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
