import { useCallback, useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiLayers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { phase3Text } from '../../../i18n/phase3I18n'
import { BusinessDiscoveryCard } from '../../businesses/BusinessDiscoveryCard'
import { FeedItemActions } from '../FeedItemActions'
import { FEED_SLIDE_SECTION_CLASS } from '../feedActionStyles.jsx'

const VARIANT_TITLE = {
  forYou: 'feed.discovery.forYou.title',
  trending: 'feed.discovery.trending.title',
  fresh: 'feed.discovery.fresh.title',
  businesses: 'feed.discovery.businesses.title',
  subscriptions: 'feed.discovery.subscriptions.title',
  spotlight: 'feed.discovery.spotlight.title',
}

const VARIANT_SUBTITLE = {
  forYou: 'feed.discovery.forYou.subtitle',
  trending: 'feed.discovery.trending.subtitle',
  fresh: 'feed.discovery.fresh.subtitle',
  businesses: 'feed.discovery.businesses.subtitle',
  subscriptions: 'feed.discovery.subscriptions.subtitle',
  spotlight: 'feed.discovery.spotlight.subtitle',
}

const MEDIA_CARD_ACTIVE =
  'h-[min(58dvh,32rem)] w-[72vw] max-w-[22rem] scale-100 opacity-100'
const MEDIA_CARD_INACTIVE =
  'h-[min(48dvh,26rem)] w-[58vw] max-w-[17rem] scale-[0.86] opacity-55'
const BUSINESS_CARD_ACTIVE =
  'w-[clamp(15.5rem,78vw,19rem)] max-w-[19rem] scale-100 opacity-100'
const BUSINESS_CARD_INACTIVE =
  'w-[clamp(13rem,66vw,16rem)] max-w-[16rem] scale-[0.92] opacity-70'

function DiscoveryCard({ card, active }) {
  return (
    <Link
      to={card.href}
      data-discovery-card
      aria-label={card.title || undefined}
      className={`relative block shrink-0 snap-center overflow-hidden rounded-[2rem] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition duration-300 ease-out ${
        active ? MEDIA_CARD_ACTIVE : MEDIA_CARD_INACTIVE
      }`}
    >
      {card.image ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black p-3">
          <img
            src={card.image}
            alt={card.title || ''}
            className="max-h-full max-w-full rounded-2xl object-contain object-center"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-slate-800/80 text-white/60">
          <FiLayers className="text-4xl" />
        </div>
      )}
    </Link>
  )
}

function DiscoveryBusinessSlideCard({ business, active, user }) {
  return (
    <div
      data-discovery-card
      className={`shrink-0 snap-center transition duration-300 ease-out ${
        active ? BUSINESS_CARD_ACTIVE : BUSINESS_CARD_INACTIVE
      }`}
    >
      <BusinessDiscoveryCard business={business} user={user} />
    </div>
  )
}

export function DiscoveryFeedSlide({ item, index, active = true }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const cards = item?.cards || []
  const businesses = item?.businesses || []
  const variant = item?.variant || 'forYou'
  const isBusinessVariant = variant === 'businesses'
  const slideCount = isBusinessVariant ? businesses.length : cards.length
  const trackRef = useRef(null)
  const [activeCard, setActiveCard] = useState(0)

  const updateActiveCard = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const cardNodes = [...track.querySelectorAll('[data-discovery-card]')]
    if (!cardNodes.length) return
    const trackCenter = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let closestDistance = Infinity
    cardNodes.forEach((node, cardIndex) => {
      const center = node.offsetLeft + node.offsetWidth / 2
      const distance = Math.abs(center - trackCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        closest = cardIndex
      }
    })
    setActiveCard(closest)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !active) return undefined
    updateActiveCard()
    track.addEventListener('scroll', updateActiveCard, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateActiveCard) : null
    observer?.observe(track)
    return () => {
      track.removeEventListener('scroll', updateActiveCard)
      observer?.disconnect()
    }
  }, [active, slideCount, updateActiveCard])

  function scrollBy(direction) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('[data-discovery-card]')
    const cardWidth = card?.offsetWidth || 280
    track.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' })
  }

  if (!slideCount) return null

  const focusedBusiness = isBusinessVariant ? businesses[activeCard] : null
  const focusedCard = !isBusinessVariant ? cards[activeCard] : null
  const actionItem = focusedBusiness
    ? {
        kind: 'discovery',
        entityId: focusedBusiness.id,
        title: focusedBusiness.name || focusedBusiness.tradeName || '',
        href: `/businesses/${focusedBusiness.id}`,
        feedHref: `/businesses/${focusedBusiness.id}`,
      }
    : focusedCard
      ? {
          kind: 'discovery',
          entityId: focusedCard.id,
          title: focusedCard.title || '',
          href: focusedCard.href || '/feed',
          feedHref: focusedCard.href || '/feed',
        }
      : null

  return (
    <section
      data-feed-slide
      data-index={index}
      className={`${FEED_SLIDE_SECTION_CLASS} bg-[var(--app-bg)]`}
    >
      <div className="relative h-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[calc(env(safe-area-inset-top,0px)+3.75rem)]">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            {p3('feed.discovery.eyebrow')}
          </p>
          <h2 className="mt-1 text-[1.35rem] font-black leading-tight text-[var(--app-text)]">
            {p3(VARIANT_TITLE[variant] || VARIANT_TITLE.forYou)}
          </h2>
          <p className="mt-1 max-w-[18rem] text-sm font-medium text-[var(--app-text-muted)]">
            {p3(VARIANT_SUBTITLE[variant] || VARIANT_SUBTITLE.forYou)}
          </p>
        </div>

        <div className="flex h-full items-center justify-center">
          <div className="relative w-full">
            <div
              ref={trackRef}
              className="scrollbar-hidden flex items-center gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[14vw] snap-x snap-mandatory touch-pan-x"
            >
              {isBusinessVariant
                ? businesses.map((business, cardIndex) => (
                    <DiscoveryBusinessSlideCard
                      key={business.id}
                      business={business}
                      user={user}
                      active={cardIndex === activeCard}
                    />
                  ))
                : cards.map((card, cardIndex) => (
                    <DiscoveryCard
                      key={`${card.type}:${card.id}`}
                      card={card}
                      active={cardIndex === activeCard}
                    />
                  ))}
            </div>

            {slideCount > 1 ? (
              <>
                {activeCard > 0 ? (
                  <button
                    type="button"
                    onClick={() => scrollBy(-1)}
                    className="pointer-events-auto absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
                    aria-label={p3('feed.discovery.prev')}
                  >
                    <FiChevronLeft className="text-xl" />
                  </button>
                ) : null}
                {activeCard < slideCount - 1 ? (
                  <button
                    type="button"
                    onClick={() => scrollBy(1)}
                    className="pointer-events-auto absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
                    aria-label={p3('feed.discovery.next')}
                  >
                    <FiChevronRight className="text-xl" />
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {active && actionItem ? (
          <FeedItemActions
            key={`${actionItem.kind}:${actionItem.entityId}`}
            item={actionItem}
          />
        ) : null}

        {slideCount > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--bottom-nav-clearance,0px)+0.5rem)] flex justify-center gap-1.5 pr-16">
            {Array.from({ length: slideCount }, (_, cardIndex) => (
              <span
                key={`dot:${cardIndex}`}
                className={`h-1.5 rounded-full transition-all ${
                  cardIndex === activeCard
                    ? 'w-5 bg-[var(--app-text)]'
                    : 'w-1.5 bg-[var(--app-text)]/35'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
