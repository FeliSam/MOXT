import { Link } from 'react-router-dom'
import { FiArrowRight, FiBriefcase, FiCalendar, FiPackage, FiShoppingBag } from 'react-icons/fi'
import { Card } from '../../components/ui/Card'
import {
  isActiveEvent,
  isActiveJob,
  isActiveParcel,
} from './publicationCatalogUtils'
import { isActiveListing } from '../marketplace/listingCatalogUtils'

const TYPE_META = {
  listing: { icon: FiShoppingBag, label: 'Annonce', path: (id) => `/marketplace/${id}` },
  job: { icon: FiBriefcase, label: 'Job', path: (id) => `/jobs/${id}` },
  event: { icon: FiCalendar, label: 'Événement', path: (id) => `/events/${id}` },
  parcel: { icon: FiPackage, label: 'Colis', path: (id) => `/parcels/${id}` },
}

/**
 * Bandeau des autres publications actives du même auteur (événements, jobs, colis, annonces).
 */
export function PublisherPublicationsStrip({
  currentId,
  ownerId,
  publications,
  allPath,
  limit = 6,
}) {
  if (!ownerId || !publications) return null

  const items = [
    ...(publications.listings || [])
      .filter((item) => isActiveListing(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'listing',
        title: item.title,
        meta: item.city || item.category || '',
      })),
    ...(publications.jobs || [])
      .filter((item) => isActiveJob(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'job',
        title: item.title,
        meta: item.location || item.sector || '',
      })),
    ...(publications.events || [])
      .filter((item) => isActiveEvent(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'event',
        title: item.title,
        meta: item.city || '',
      })),
    ...(publications.parcels || [])
      .filter((item) => isActiveParcel(item) && item.id !== currentId)
      .map((item) => ({
        id: item.id,
        kind: 'parcel',
        title: `${item.origin} → ${item.destination}`,
        meta: item.departureDate || '',
      })),
  ].slice(0, limit)

  if (!items.length) return null

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-black">Autres publications</h2>
        {allPath ? (
          <Link
            to={allPath}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300"
          >
            Tout voir <FiArrowRight />
          </Link>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const meta = TYPE_META[item.kind]
          const Icon = meta.icon
          return (
            <Link
              key={`${item.kind}-${item.id}`}
              to={meta.path(item.id)}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 transition hover:border-brand-300 hover:bg-[var(--app-surface)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
                  {meta.label}
                </span>
                <strong className="mt-0.5 block truncate text-sm">{item.title}</strong>
                {item.meta ? (
                  <span className="mt-0.5 block truncate text-xs text-[var(--app-text-muted)]">
                    {item.meta}
                  </span>
                ) : null}
              </span>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
