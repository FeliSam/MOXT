import { Link } from 'react-router-dom'
import { FiArrowRight, FiBriefcase, FiCalendar, FiPackage, FiShoppingBag } from 'react-icons/fi'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { jobSectorLabel } from '../jobs/jobDisplayUtils'
import {
  isActiveEvent,
  isActiveJob,
  isActiveParcel,
} from './publicationCatalogUtils'
import { isActiveListing } from '../marketplace/listingCatalogUtils'

const TYPE_META = {
  listing: { icon: FiShoppingBag, labelKey: 'publications.types.listing', path: (id) => `/marketplace/${id}` },
  job: { icon: FiBriefcase, labelKey: 'publications.types.job', path: (id) => `/jobs/${id}` },
  event: { icon: FiCalendar, labelKey: 'publications.types.event', path: (id) => `/events/${id}` },
  parcel: { icon: FiPackage, labelKey: 'publications.types.parcel', path: (id) => `/parcels/${id}` },
}

function publicationImage(item) {
  const first = item.images?.[0]
  if (typeof first === 'string' && first) return first
  if (first?.url) return first.url
  if (typeof item.image === 'string' && item.image) return item.image
  if (typeof item.coverImage === 'string' && item.coverImage) return item.coverImage
  return null
}

/**
 * Bandeau des autres publications actives du même auteur (événements, jobs, colis, annonces).
 */
export function PublisherPublicationsStrip({
  currentId,
  ownerId,
  publications,
  allPath,
  limit = 8,
}) {
  const { t } = useLanguage()

  if (!ownerId || !publications) return null

  const items = [
    ...(publications.listings || [])
      .filter((item) => isActiveListing(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'listing',
        title: item.title,
        meta: item.city || item.category || '',
        image: publicationImage(item),
      })),
    ...(publications.jobs || [])
      .filter((item) => isActiveJob(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'job',
        title: item.title,
        meta: item.location || (item.sector ? jobSectorLabel(t, item.sector) : '') || '',
        image: publicationImage(item),
      })),
    ...(publications.events || [])
      .filter((item) => isActiveEvent(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'event',
        title: item.title,
        meta: item.city || '',
        image: publicationImage(item),
      })),
    ...(publications.parcels || [])
      .filter((item) => isActiveParcel(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'parcel',
        title: `${item.origin} → ${item.destination}`,
        meta: item.departureDate || '',
        image: publicationImage(item),
      })),
  ].slice(0, limit)

  if (!items.length) return null

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-black">{t('publications.strip.title')}</h2>
        {allPath ? (
          <Link
            to={allPath}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300"
          >
            {t('publications.strip.viewAll')} <FiArrowRight />
          </Link>
        ) : null}
      </div>

      <div className="relative min-w-0">
        <div
          className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 scroll-smooth [-webkit-overflow-scrolling:touch]"
          role="list"
          aria-label={t('publications.strip.title')}
        >
          {items.map((item) => {
            const meta = TYPE_META[item.kind]
            const Icon = meta.icon
            return (
              <Link
                key={`${item.kind}-${item.id}`}
                to={meta.path(item.id)}
                role="listitem"
                className="group flex w-[11.25rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] transition hover:border-brand-300 hover:bg-[var(--app-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:w-[12.5rem]"
              >
                {item.image ? (
                  <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--app-surface)]">
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2.5 pb-2 pt-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-800">
                        <Icon className="text-[10px]" aria-hidden />
                        {t(meta.labelKey)}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="relative grid aspect-[4/3] place-items-center bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <Icon className="text-2xl" aria-hidden />
                    <span className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface)]/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                        <Icon className="text-[10px]" aria-hidden />
                        {t(meta.labelKey)}
                      </span>
                    </span>
                  </span>
                )}
                <span className="flex min-h-[4.25rem] flex-col justify-center gap-0.5 p-3">
                  <strong className="line-clamp-2 text-sm leading-snug">{item.title}</strong>
                  {item.meta ? (
                    <span className="truncate text-xs text-[var(--app-text-muted)]">{item.meta}</span>
                  ) : null}
                </span>
              </Link>
            )
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--app-surface)] to-transparent"
          aria-hidden
        />
      </div>
    </Card>
  )
}
