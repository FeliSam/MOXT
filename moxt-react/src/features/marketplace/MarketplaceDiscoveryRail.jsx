import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'
import { useListingRailImpression } from '../../hooks/useListingRailImpression'
import { MarketplaceListingCard } from './MarketplaceListingCard'
import {
  MARKETPLACE_DISCOVERY_ITEM_CLASS,
  MARKETPLACE_DISCOVERY_TRACK_CLASS,
} from './marketplaceDiscoveryLayout'

const RAIL_BADGE_CLASS = {
  forYou: 'bg-brand-700 text-white',
  trending: 'bg-amber-600 text-white',
  fresh: 'bg-emerald-600 text-white',
}

function RailListingCard({
  listing,
  guestMode,
  onGuestInteract,
  badgeLabel,
  railId,
  trackImpressions,
}) {
  const impressionRef = useListingRailImpression(listing.id, {
    enabled: trackImpressions,
    railId,
  })
  const badge = badgeLabel ? (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] shadow-md ${RAIL_BADGE_CLASS[railId] || RAIL_BADGE_CLASS.forYou}`}
    >
      {badgeLabel}
    </span>
  ) : null

  return (
    <div ref={impressionRef} data-rail-card className={MARKETPLACE_DISCOVERY_ITEM_CLASS}>
      <MarketplaceListingCard
        listing={listing}
        guestMode={guestMode}
        onGuestInteract={onGuestInteract}
        layout="rail"
        badge={badge}
      />
    </div>
  )
}

export function MarketplaceDiscoveryRail({
  railId,
  title,
  subtitle,
  listings,
  guestMode,
  onGuestInteract,
  badgeLabel,
  onViewAll,
  viewAllLabel,
  scrollPrevLabel,
  scrollNextLabel,
  trackImpressions = true,
}) {
  const scrollRef = useHorizontalScroll()
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    function updateEdges() {
      const maxScroll = el.scrollWidth - el.clientWidth
      setEdges({
        left: el.scrollLeft > 8,
        right: maxScroll > 8 && el.scrollLeft < maxScroll - 8,
      })
    }

    updateEdges()
    el.addEventListener('scroll', updateEdges, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      observer?.disconnect()
    }
  }, [listings, scrollRef])

  if (!listings?.length) return null

  function scrollBy(direction) {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('[data-rail-card]')
    const cardWidth = card?.offsetWidth || 280
    el.scrollBy({ left: direction * (cardWidth + 12), behavior: 'smooth' })
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400"
          >
            {viewAllLabel}
          </button>
        ) : null}
      </div>

      <div className="relative min-w-0">
        {edges.left ? (
          <button
            type="button"
            aria-label={scrollPrevLabel}
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 z-[2] grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 text-[var(--app-text)] shadow-sm backdrop-blur-sm"
          >
            <FiChevronLeft aria-hidden />
          </button>
        ) : null}
        {edges.right ? (
          <button
            type="button"
            aria-label={scrollNextLabel}
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 z-[2] grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 text-[var(--app-text)] shadow-sm backdrop-blur-sm"
          >
            <FiChevronRight aria-hidden />
          </button>
        ) : null}

        <div ref={scrollRef} className={MARKETPLACE_DISCOVERY_TRACK_CLASS} data-navbar-ignore>
          {listings.map((listing) => (
            <RailListingCard
              key={listing.id}
              listing={listing}
              guestMode={guestMode}
              onGuestInteract={onGuestInteract}
              badgeLabel={badgeLabel}
              railId={railId}
              trackImpressions={trackImpressions}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
