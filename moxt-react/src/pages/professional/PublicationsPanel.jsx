import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ImageLightbox } from '../../components/ui/ImageLightbox'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'
import { moderateEvent } from '../../features/events/eventSlice'
import { moderateJob } from '../../features/jobs/jobSlice'
import { updateListingStatus } from '../../features/marketplace/marketplaceSlice'
import { updateParcelStatus } from '../../features/parcels/parcelSlice'

const FILTER_OPTIONS = [
  { value: 'all', labelKey: 'professional.publications.all' },
  { value: 'listings', labelKey: 'professional.publications.listings' },
  { value: 'jobs', labelKey: 'professional.publications.jobs' },
  { value: 'events', labelKey: 'professional.publications.events' },
  { value: 'parcels', labelKey: 'professional.publications.parcels' },
]

export function PublicationsPanel({ dispatch, publications }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const [activeType, setActiveType] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const contentPath = {
    listings: '/marketplace',
    jobs: '/jobs',
    events: '/events',
    parcels: '/parcels',
  }
  const editPath = {
    listings: (id) => `/marketplace/${id}/edit`,
    jobs: (id) => `/jobs/${id}/edit`,
    events: (id) => `/events/${id}/edit`,
    parcels: (id) => `/parcels/${id}/edit`,
  }
  const actions = useMemo(
    () => ({
      events: (id, status) => dispatch(moderateEvent({ id, status })),
      jobs: (id, status) => dispatch(moderateJob({ id, status })),
      listings: (id, status) => dispatch(updateListingStatus({ id, status })),
      parcels: (id, status) => dispatch(updateParcelStatus({ id, status })),
    }),
    [dispatch],
  )
  const submenus = useMemo(
    () =>
      FILTER_OPTIONS.map((item) => ({
        ...item,
        count:
          item.value === 'all'
            ? publications.length
            : publications.filter((entry) => entry.contentType === item.value).length,
      })).filter((item) => item.value === 'all' || item.count > 0),
    [publications],
  )
  const visiblePublications =
    activeType === 'all'
      ? publications
      : publications.filter((item) => item.contentType === activeType)

  if (!publications.length) {
    return <EmptyState title={pt('professional.publications.empty')} />
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {submenus.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActiveType(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeType === item.value
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
            }`}
          >
            {pt(item.labelKey)} ({item.count})
          </button>
        ))}
      </div>
      {visiblePublications.map((item) => {
        const meta = statusMeta(item.status, t)
        const canPublish = ['archived', 'suspended', 'draft'].includes(item.status)
        const update = actions[item.contentType]
        return (
          <Card
            key={`${item.contentType}-${item.id}`}
            className="relative min-w-0 overflow-hidden !p-3 sm:!p-5"
          >
            <span className="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
              <Badge tone={meta.tone} className="!px-1.5 !py-0.5 !text-[9px]">
                {meta.label}
              </Badge>
            </span>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3 pr-14 sm:pr-0">
                {item.images?.[0] ? (
                  <button
                    type="button"
                    className="shrink-0 overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    aria-label={pt('professional.publications.viewImages')}
                    onClick={() =>
                      setLightbox({
                        images: item.images.filter(Boolean),
                        index: 0,
                        alt: item.title || '',
                      })
                    }
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="size-16 object-cover sm:size-20"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <strong className="block break-words text-sm sm:text-base">
                    {item.title ||
                      pt('professional.publications.route', {
                        origin: item.origin,
                        destination: item.destination,
                      })}
                  </strong>
                  <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">
                    {item.contentType}
                  </p>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                {item.images?.length ? (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setLightbox({
                        images: item.images.filter(Boolean),
                        index: 0,
                        alt: item.title || '',
                      })
                    }
                  >
                    {pt('professional.publications.viewImages')}
                  </Button>
                ) : null}
                <Link to={`${contentPath[item.contentType]}/${item.id}`} className="min-w-0">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {pt('professional.publications.view')}
                  </Button>
                </Link>
                {editPath[item.contentType] ? (
                  <Link to={editPath[item.contentType](item.id)} className="min-w-0">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      {pt('professional.publications.edit')}
                    </Button>
                  </Link>
                ) : null}
                {update ? (
                  <>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => update(item.id, canPublish ? 'active' : 'suspended')}
                    >
                      {canPublish
                        ? pt('professional.publications.publish')
                        : pt('professional.publications.suspend')}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full sm:w-auto"
                      onClick={() => update(item.id, 'archived')}
                    >
                      {pt('professional.publications.archive')}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        )
      })}
      <ImageLightbox
        open={Boolean(lightbox)}
        images={lightbox?.images || []}
        index={lightbox?.index || 0}
        alt={lightbox?.alt || ''}
        onClose={() => setLightbox(null)}
        onIndexChange={(updater) =>
          setLightbox((current) =>
            current
              ? {
                  ...current,
                  index:
                    typeof updater === 'function' ? updater(current.index) : updater,
                }
              : current,
          )
        }
      />
    </div>
  )
}
