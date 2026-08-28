import { memo, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiEye, FiMapPin, FiShoppingBag } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { FavoriteButton } from '../../components/ui/FavoriteButton'
import { categoriesForType, LISTING_TYPES_META } from '../../config/listingConfig'
import { useLanguage } from '../../contexts/useLanguage'
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'
import { phase3Text } from '../../i18n/phase3I18n'
import { markListingViewed, toggleAccountFavorite } from '../account/accountSlice'
import { buildListingFavoriteSnapshot } from '../account/favoriteUtils'
import { archivedPublicationCardClass } from '../publications/publicationCatalogUtils'
import { formatMoney } from '../transfers/transferUtils'
import { listingOptionLabel, marketplaceText } from './marketplaceI18n'

function MarketplaceListingCardComponent({
  listing,
  linked = true,
  showFavorite = true,
  guestMode = false,
  onGuestInteract,
  actions = null,
  badge = null,
  archived = false,
  layout = 'grid',
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const [failedSrc, setFailedSrc] = useState(() => new Set())
  const [slide, setSlide] = useState(0)
  const scrollRef = useHorizontalScroll()
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
  const images = (listing.images || []).filter((src) => src && !failedSrc.has(src))
  const multi = images.length > 1

  function handleToggleLike(event) {
    event.preventDefault()
    event.stopPropagation()
    if (guestMode) {
      onGuestInteract?.()
      return
    }
    if (!user?.id) return
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

  function handleGuestClick(event) {
    if (!guestMode) return
    event.preventDefault()
    event.stopPropagation()
    onGuestInteract?.()
  }

  const onCarouselScroll = useCallback((event) => {
    const width = event.currentTarget.clientWidth
    if (!width) return
    const next = Math.round(event.currentTarget.scrollLeft / width)
    setSlide((current) => (current === next ? current : next))
  }, [])

  function goToSlide(index, event) {
    event?.preventDefault()
    event?.stopPropagation()
    const el = scrollRef.current
    if (!el) return
    const bounded = Math.min(images.length - 1, Math.max(0, index))
    el.scrollTo({ left: bounded * el.clientWidth, behavior: 'smooth' })
  }

  const isRail = layout === 'rail'

  return (
    <div
      role="article"
      className={`group relative h-full overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-card)] ${
        isRail
          ? ''
          : 'md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:shadow-[var(--shadow-card-hover)]'
      } ${archived ? archivedPublicationCardClass : ''}`}
    >
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br from-cyan-700 to-blue-600 ${
          isRail ? 'h-full' : 'h-[290px] xl:h-[333px]'
        } ${archived ? 'opacity-75 saturate-[0.85]' : ''}`}
      >
        {images.length ? (
          <div
            ref={scrollRef}
            className="scrollbar-hidden flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
            onScroll={multi ? onCarouselScroll : undefined}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {images.map((src, index) => {
              const img = (
                <img
                  src={src}
                  alt={listing.title}
                  className={`h-full w-full object-cover ${isRail ? '' : 'md:transition md:duration-500 md:ease-out md:group-hover:scale-[1.05]'}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                  onError={() => {
                    setFailedSrc((current) => {
                      const next = new Set(current)
                      next.add(src)
                      return next
                    })
                  }}
                />
              )
              const slideClass = 'relative h-full w-full min-w-full shrink-0 snap-start'
              if (linked) {
                return (
                  <Link
                    key={`${src}-${index}`}
                    to={detailPath}
                    className={slideClass}
                    onClick={() => {
                      if (!guestMode) handleOpen()
                    }}
                  >
                    {img}
                  </Link>
                )
              }
              return (
                <div
                  key={`${src}-${index}`}
                  className={`${slideClass} cursor-pointer`}
                  onClick={handleOpen}
                >
                  {img}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center text-white">
            <FiShoppingBag className="text-4xl opacity-90" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {badge ? (
          <div className="absolute left-2.5 top-2.5 z-[2]">{badge}</div>
        ) : viewed ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-[2]">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-white shadow-md">
              <FiEye className="text-[10px] text-white" aria-hidden="true" />
              {mt('marketplace.common.viewed')}
            </span>
          </span>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-3 sm:p-4">
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

        {multi ? (
          <>
            <button
              type="button"
              className="absolute left-1.5 top-1/2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white shadow-sm transition hover:bg-black/70 sm:grid"
              aria-label={mt('marketplace.common.previous')}
              onClick={(event) => goToSlide(slide - 1, event)}
            >
              <FiChevronLeft className="text-base" />
            </button>
            <button
              type="button"
              className="absolute right-1.5 top-1/2 z-20 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white shadow-sm transition hover:bg-black/70 sm:grid"
              aria-label={mt('marketplace.common.next')}
              onClick={(event) => goToSlide(slide + 1, event)}
            >
              <FiChevronRight className="text-base" />
            </button>
            <div className="pointer-events-none absolute inset-x-0 top-2.5 z-[2] flex justify-center gap-1">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  aria-label={`${index + 1} / ${images.length}`}
                  className={`pointer-events-auto h-1 rounded-full transition ${
                    index === slide ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  onClick={(event) => goToSlide(index, event)}
                />
              ))}
            </div>
          </>
        ) : null}

        {showFavorite && !actions ? (
          <FavoriteButton
            active={liked}
            onToggle={handleToggleLike}
            className="!absolute !right-2.5 !top-2.5 z-30"
          />
        ) : null}
      </div>
      {actions ? (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,7.75rem),1fr))] gap-1.5 bg-[var(--app-surface)] p-2.5 [&>a]:min-w-0 [&>button]:min-w-0 [&_button]:min-w-0 [&_button]:w-full [&_button]:max-w-full [&_button]:flex-wrap [&_button]:whitespace-normal">
          {linked ? (
            <Link to={detailPath} onClick={handleGuestClick}>
              <Button variant="secondary" icon={FiExternalLink} size="sm" className="w-full">
                {phase3Text(t, 'publications.cards.open')}
              </Button>
            </Link>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export const MarketplaceListingCard = memo(MarketplaceListingCardComponent)
