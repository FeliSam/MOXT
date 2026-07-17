import { FiBriefcase, FiCalendar, FiClock, FiHeart, FiMessageCircle, FiMessageSquare, FiPackage } from 'react-icons/fi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { RevealListItem } from '../../../components/ui/RevealListItem'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { useLanguage } from '../../../contexts/useLanguage'
import { MarketplaceListingCard } from '../../marketplace/MarketplaceListingCard'
import { formatParcelDepartureLabel } from '../../parcels/parcelUtils'
import { formatDate } from '../../transfers/transferUtils'
import { sortPostsByPublishedAt } from '../../posts/postSortUtils'
import {
  dashboardCarouselTrackClass,
  dashboardListingItemClass,
  dashboardListingTrackClass,
} from '../dashboardConfig'
import { DashboardLiveList } from './DashboardLiveList'
import { DashboardSectionHeading } from './DashboardSectionHeading'
import { ScrollArrows } from './ScrollArrows'

export function DashboardDiscoverySection({
  conversations,
  events,
  eventsLoading,
  jobs,
  jobsLoading,
  listings,
  listingsLoading,
  listingsScrollRef,
  myTransfers,
  parcels,
  parcelsLoading,
}) {
  const { t } = useLanguage()
  const allPosts = useSelector((s) => s.posts?.items ?? [])
  const posts = useMemo(
    () => sortPostsByPublishedAt(allPosts.filter((p) => p.status === 'published')).slice(0, 3),
    [allPosts],
  )

  return (
    <>
      <RevealOnScroll delay={80}>
        <DashboardSectionHeading
          title={t('dashboard.discovery.latestListings')}
          link="/marketplace"
          linkLabel={t('dashboard.discovery.viewMarket')}
        />
      </RevealOnScroll>
      <div className="relative min-w-0 pb-3">
        <div ref={listingsScrollRef} className={`${dashboardListingTrackClass} min-w-0`}>
          {listingsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={dashboardListingItemClass}>
                  <SkeletonCard />
                </div>
              ))
            : listings.map((listing, index) => (
                <RevealListItem key={listing.id} index={index} className={dashboardListingItemClass}>
                  <MarketplaceListingCard listing={listing} />
                </RevealListItem>
              ))}
        </div>
        <ScrollArrows scrollRef={listingsScrollRef} />
      </div>

      <section className="grid min-w-0 gap-6 [&>*]:min-w-0">
        <DashboardLiveList
          accent="parcels"
          title={t('dashboard.discovery.availableParcels')}
          description={t('dashboard.discovery.recentTrips')}
          path="/parcels"
          icon={FiPackage}
          loading={parcelsLoading}
          items={parcels.map((item) => ({
            id: item.id,
            icon: FiPackage,
            title:
              [item.origin, item.originAirportCode && `(${item.originAirportCode})`]
                .filter(Boolean)
                .join(' ') +
              ' → ' +
              [item.destination, item.destinationAirportCode && `(${item.destinationAirportCode})`]
                .filter(Boolean)
                .join(' '),
            meta: item.ownerName || undefined,
            highlight: formatParcelDepartureLabel(item, t),
            chips: [
              item.remainingKg != null
                ? t('dashboard.discovery.kgAvailable', { kg: item.remainingKg })
                : null,
              item.pricePerKg != null
                ? t('dashboard.discovery.pricePerKg', {
                    price: item.pricePerKg,
                    currency: item.currency || 'RUB',
                  })
                : null,
            ].filter(Boolean),
          }))}
        />
        <DashboardLiveList
          accent="jobs"
          title={t('dashboard.discovery.recentJobs')}
          description={t('dashboard.discovery.recentMissions')}
          path="/jobs"
          icon={FiBriefcase}
          loading={jobsLoading}
          items={jobs.map((item) => ({
            id: item.id,
            icon: FiBriefcase,
            title: item.title,
            meta: [item.salary ? `${item.salary} ${item.currency || 'RUB'}` : null, item.city || item.location]
              .filter(Boolean)
              .join(' · '),
            badge: item.sector || item.contractType,
          }))}
        />
        <DashboardLiveList
          accent="events"
          title={t('dashboard.discovery.upcomingEvents')}
          description={t('dashboard.discovery.upcomingMeetups')}
          path="/events"
          icon={FiCalendar}
          loading={eventsLoading}
          items={events.map((item) => ({
            id: item.id,
            icon: FiCalendar,
            title: item.title,
            meta: [item.city, item.format === 'online' ? t('dashboard.discovery.online') : null]
              .filter(Boolean)
              .join(' · '),
            footer: formatDate(item.startAt),
            badge: item.organizerName || item.category,
          }))}
        />
      </section>

      <RevealOnScroll delay={80}>
        <DashboardSectionHeading
          title={t('dashboard.discovery.newsTitle')}
          link="/news"
          linkLabel={t('dashboard.discovery.readAll')}
        />
      </RevealOnScroll>
      {posts.length > 0 ? (
        <div className={dashboardCarouselTrackClass}>
          {posts.map((post, index) => (
            <RevealListItem
              key={post.id}
              index={index}
              className="w-[clamp(14rem,72vw,19rem)] shrink-0 sm:w-[clamp(15rem,48vw,20rem)] lg:w-[clamp(16rem,28vw,21rem)]"
            >
              <DashboardPostCard post={post} />
            </RevealListItem>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-3xl">📰</span>
          <p className="text-sm text-[var(--app-text-muted)]">{t('dashboard.discovery.noNews')}</p>
          <Link to="/news">
            <Button variant="secondary">{t('dashboard.discovery.newsLink')}</Button>
          </Link>
        </Card>
      )}

      <section className="grid min-w-0 gap-6 [&>*]:min-w-0">
        <Card className="relative overflow-hidden bg-slate-950 text-white dark:bg-black">
          <div className="absolute right-0 top-0 size-48 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-xl">
              <FiClock />
            </span>
            <h2 className="mt-6 text-2xl font-black">{t('dashboard.activity.title')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
              {t('dashboard.activity.description')}
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [myTransfers.length, t('dashboard.activity.transfers'), '/transfers/history'],
                [conversations, t('dashboard.activity.discussions'), '/messages'],
                [jobs.length + events.length, t('dashboard.activity.activity'), '/activities'],
              ].map(([value, label, to]) => (
                <Link
                  key={label}
                  to={to}
                  className="rounded-2xl bg-white/8 p-3 transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                >
                  <strong className="block text-2xl">{value}</strong>
                  <span className="text-[10px] text-white/55">{label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Link to="/activities">
                <Button>{t('dashboard.activity.myActivities')}</Button>
              </Link>
              <Link to="/messages">
                <Button className="bg-white/10 text-white shadow-none hover:bg-white/20">
                  <FiMessageSquare /> {t('dashboard.activity.messages')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </>
  )
}

const TYPE_COLORS = {
  listing:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  parcel:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  event:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  job:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  free:     'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]',
}

const TYPE_LABEL_KEYS = {
  listing: 'dashboard.postTypes.listing',
  parcel: 'dashboard.postTypes.parcel',
  business: 'dashboard.postTypes.business',
  event: 'dashboard.postTypes.event',
  job: 'dashboard.postTypes.job',
  free: 'dashboard.postTypes.news',
}

function DashboardPostCard({ post }) {
  const { t } = useLanguage()
  const typeLabelKey = TYPE_LABEL_KEYS[post.sourceType] ?? TYPE_LABEL_KEYS.free

  return (
    <Link to={`/news`}>
      <Card className="relative flex h-full flex-col overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
        {/* Type badge — absolu top-right */}
        <span className={`absolute right-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-black ${TYPE_COLORS[post.sourceType] ?? TYPE_COLORS.free}`}>
          {t(typeLabelKey)}
        </span>

        {/* Auteur */}
        <div className="flex items-center gap-2 pr-14">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt="" className="size-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-black text-white">
              {post.authorName?.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold leading-tight">{post.authorName}</p>
            <p className="text-[10px] text-[var(--app-text-faint)]">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt=""
            className="mt-2.5 h-[8.5rem] w-full rounded-xl object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Message */}
        <p className="mt-2.5 line-clamp-4 flex-1 text-xs leading-relaxed text-[var(--app-text-muted)]">
          {post.message}
        </p>

        {/* Compteurs */}
        <div className="mt-3 flex items-center gap-3 border-t border-[var(--app-border)] pt-2.5 text-[10px] text-[var(--app-text-faint)]">
          <span className="flex items-center gap-1">
            <FiHeart className="text-[10px]" />{post.likes?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <FiMessageCircle className="text-[10px]" />{post.comments?.length || 0}
          </span>
        </div>
      </Card>
    </Link>
  )
}
