import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '../../components/ui/Badge'
import { FavoriteButton } from '../../components/ui/FavoriteButton'
import { categoriesForType, LISTING_TYPES_META } from '../../config/listingConfig'
import { useLanguage } from '../../contexts/useLanguage'
import { markListingViewed, toggleAccountFavorite } from '../account/accountSlice'
import { buildListingFavoriteSnapshot } from '../account/favoriteUtils'
import { formatMoney } from '../transfers/transferUtils'
import { listingOptionLabel, marketplaceText } from './marketplaceI18n'

function MarketplaceListingCardComponent({ listing, linked = true, showFavorite = true }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const [imageFailed, setImageFailed] = useState(false)
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
  const typeOption = LISTING_TYPES_META.find((option) => option.value === listing.type)
  const categoryOption = categoriesForType(listing.type).find(
    (option) => option.value === listing.category,
  )
  const typeLabel = typeOption ? listingOptionLabel(t, typeOption) : listing.type
  const categoryLabel = categoryOption
    ? listingOptionLabel(t, categoryOption)
    : listing.category
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

  function handleOpen() {
    if (!user) return
    dispatch(markListingViewed({ userId: user.id, listingId: listing.id }))
  }

  const coverImage = listing.images?.[0]

  const mediaBody = (
    <>
      {coverImage && !imageFailed ? (
        <img
          src={coverImage}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-white">
          <FiShoppingBag className="text-4xl opacity-90" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      {viewed ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 z-[1]">
          <Badge tone="slate" className="bg-black/40 text-white backdrop-blur-sm">
            <FiEye className="text-[10px]" aria-hidden="true" />
            {mt('marketplace.common.viewed')}
          </Badge>
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
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
            {listing.price
              ? formatMoney(listing.price, listing.currency)
              : mt('marketplace.common.onQuote')}
          </strong>
          <p className="flex min-w-0 shrink-0 items-center gap-1 text-[11px] text-white/75">
            <FiMapPin className="shrink-0" />
            <span className="max-w-[8rem] truncate">{listing.city}</span>
          </p>
        </div>
      </div>
    </>
  )

  return (
    <div
      role="article"
      className="group relative h-full overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative h-[280px] w-full bg-gradient-to-br from-cyan-700 to-blue-600">
        {linked ? (
          <Link to={detailPath} className="absolute inset-0 block" onClick={handleOpen}>
            {mediaBody}
          </Link>
        ) : (
          <div className="absolute inset-0 cursor-pointer" onClick={handleOpen}>
            {mediaBody}
          </div>
        )}

        {showFavorite ? (
          <FavoriteButton
            active={liked}
            onToggle={handleToggleLike}
            className="!absolute !right-2.5 !top-2.5 z-30"
          />
        ) : null}
      </div>
    </div>
  )
}

export const MarketplaceListingCard = memo(MarketplaceListingCardComponent)
