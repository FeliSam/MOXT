import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/useLanguage'
import { LISTING_CONDITIONS, optionLabel } from '../../../config/options'
import { resolveListingImageUrl } from '../../marketplace/listingImageUtils'
import { listingOptionLabel, marketplaceText } from '../../marketplace/marketplaceI18n'
import { formatMoney } from '../../transfers/transferUtils'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedMediaImage } from '../FeedMediaImage'
import { FeedSlideShell } from '../FeedSlideShell'

function listingSizeLabel(listing, t) {
  const mt = (key, vars) => marketplaceText(t, key, vars)
  if (listing?.weight) return { label: mt('marketplace.extra.weight.label'), value: listing.weight }
  if (listing?.fileSize) {
    return { label: mt('marketplace.extra.fileSize.label'), value: listing.fileSize }
  }
  if (listing?.surface != null && listing.surface !== '') {
    return {
      label: mt('marketplace.extra.surface.label'),
      value: `${listing.surface} m²`,
    }
  }
  if (listing?.color) return { label: mt('marketplace.common.color'), value: listing.color }
  if (listing?.condition) {
    const conditionOption = LISTING_CONDITIONS.find(({ value }) => value === listing.condition)
    return {
      label: mt('marketplace.common.condition'),
      value: conditionOption
        ? listingOptionLabel(t, conditionOption)
        : optionLabel(LISTING_CONDITIONS, listing.condition),
    }
  }
  if (listing?.stock != null && listing.stock !== '') {
    return { label: mt('marketplace.common.stock'), value: String(listing.stock) }
  }
  return null
}

export function ListingFeedSlide({ item, index, active = true }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const images = useMemo(() => {
    const list = (item.media?.images || []).map(resolveListingImageUrl).filter(Boolean)
    return list.length ? list : ['']
  }, [item.media?.images])
  const [activeImage, setActiveImage] = useState(0)
  const [broken, setBroken] = useState({})
  const scrollerRef = useRef(null)
  const sizeInfo = listingSizeLabel(item.source, t)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || images.length <= 1) return undefined
    const slides = [...scroller.querySelectorAll('[data-listing-image]')]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        setActiveImage(Number(visible.target.getAttribute('data-image-index') || 0))
      },
      { root: scroller, threshold: [0.55, 0.75] },
    )
    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [images])

  const price =
    item.stats?.price != null && item.stats.price !== ''
      ? formatMoney(item.stats.price, item.stats.currency)
      : null

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={item.publisher}
      title={item.title}
      caption={item.caption}
      captionLines={1}
      active={active}
      ctaLabel={p3('feed.cta.listing')}
      ctaTo={item.href}
      metaExtra={
        <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {sizeInfo ? (
            <p className="truncate text-xs font-semibold text-white/75">
              <span className="text-white/55">{sizeInfo.label} · </span>
              {sizeInfo.value}
            </p>
          ) : null}
          {price ? <p className="shrink-0 text-base font-black text-white">{price}</p> : null}
        </div>
      }
    >
      <div className="relative h-full w-full bg-gradient-to-br from-slate-800 to-slate-950">
        <div
          ref={scrollerRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hidden"
          data-testid="listing-feed-images"
        >
          {images.map((url, imageIndex) => {
            const showImage = Boolean(url) && !broken[imageIndex]
            return (
              <div
                key={`${item.id}-${imageIndex}`}
                data-listing-image
                data-image-index={imageIndex}
                className="relative h-full min-w-full shrink-0 basis-full snap-center snap-always"
              >
                {showImage ? (
                  <FeedMediaImage
                    src={url}
                    loading={imageIndex === 0 ? 'eager' : 'lazy'}
                    onError={() => setBroken((prev) => ({ ...prev, [imageIndex]: true }))}
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-gradient-to-br from-amber-700 to-orange-900 text-white/80">
                    <span className="text-sm font-bold">{p3('feed.noImage')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {images.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 z-10 flex justify-center gap-1.5 px-4 bottom-[calc(var(--bottom-nav-clearance)+1.15rem)]">
            {images.map((_, imageIndex) => (
              <span
                key={`dot-${imageIndex}`}
                className={`h-1.5 rounded-full transition-all ${
                  imageIndex === activeImage ? 'w-5 bg-white' : 'w-1.5 bg-white/45'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </FeedSlideShell>
  )
}
