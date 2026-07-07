import { memo } from 'react'
import { FiEye, FiHeart, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { categoriesForType, LISTING_TYPES_META } from '../../config/listingConfig'
import { markListingViewed, toggleAccountFavorite } from '../account/accountSlice'
import { buildListingFavoriteSnapshot } from '../account/favoriteUtils'
import { formatMoney } from '../transfers/transferUtils'

// Memoise : la grille parente se re-rend a chaque frappe du formulaire de
// publication ; le listing venant de Redux est une reference stable, donc la
// carte ne se re-rend que si son annonce change reellement.
function MarketplaceListingCardComponent({ listing }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const liked = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user?.id && item.relatedType === 'listing' && item.relatedId === listing.id,
    ),
  )
  const viewed = useSelector((state) =>
    state.account.viewedListings?.some(
      (item) => item.userId === user?.id && item.listingId === listing.id,
    ),
  )
  const typeLabel =
    LISTING_TYPES_META.find((option) => option.value === listing.type)?.label || listing.type
  const categoryLabel =
    categoriesForType(listing.type).find((option) => option.value === listing.category)?.label ||
    listing.category

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
        path: `/marketplace/${listing.id}`,
        snapshot: buildListingFavoriteSnapshot(listing),
      }),
    )
  }

  function handleOpen() {
    if (!user) return
    dispatch(markListingViewed({ userId: user.id, listingId: listing.id }))
  }

  return (
    <div
      role="article"
      onClick={handleOpen}
      className="group relative h-full cursor-pointer overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Image plein format — taille fixe */}
      <div className="relative h-[280px] w-full bg-gradient-to-br from-cyan-700 to-blue-600">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-white">
            <FiShoppingBag className="text-4xl opacity-90" />
          </div>
        )}

        {/* Dégradé bas pour lisibilité du texte en overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Bouton favori */}
        <button
          type="button"
          onClick={handleToggleLike}
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={liked}
          className={`absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            liked
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-white/20 text-white hover:scale-105 hover:bg-white/35'
          }`}
        >
          <FiHeart className={liked ? 'fill-current' : ''} />
        </button>

        {/* Badge "Vu" */}
        {viewed ? (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="slate" className="bg-black/40 text-white backdrop-blur-sm">
              <FiEye className="text-[10px]" aria-hidden="true" />
              Vu
            </Badge>
          </span>
        ) : null}

        {/* Contenu en overlay bas */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="mb-1.5 flex flex-wrap gap-1">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm sm:text-[10px]">
              {typeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black text-white/80 backdrop-blur-sm sm:text-[10px]">
              {categoryLabel}
            </span>
          </div>
          <h2 className="line-clamp-2 break-words text-sm font-black leading-snug text-white drop-shadow sm:text-base">
            {listing.title}
          </h2>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <strong className="block break-words text-sm tabular-nums font-black text-white drop-shadow sm:text-base">
              {listing.price ? formatMoney(listing.price, listing.currency) : 'Sur devis'}
            </strong>
            <p className="flex min-w-0 shrink-0 items-center gap-1 text-[11px] text-white/75">
              <FiMapPin className="shrink-0" />
              <span className="truncate max-w-[8rem]">{listing.city}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MarketplaceListingCard = memo(MarketplaceListingCardComponent)
