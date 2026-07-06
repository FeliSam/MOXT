import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { statusMeta } from '../../config/statuses'
import { moderateEvent } from '../../features/events/eventSlice'
import { moderateJob } from '../../features/jobs/jobSlice'
import { updateListingStatus } from '../../features/marketplace/marketplaceSlice'
import { updateParcelStatus } from '../../features/parcels/parcelSlice'

export function PublicationsPanel({ dispatch, publications }) {
  const [activeType, setActiveType] = useState('all')
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
      [
        { value: 'all', label: 'Toutes', count: publications.length },
        {
          value: 'listings',
          label: 'Annonces',
          count: publications.filter((item) => item.contentType === 'listings').length,
        },
        {
          value: 'jobs',
          label: 'Jobs',
          count: publications.filter((item) => item.contentType === 'jobs').length,
        },
        {
          value: 'events',
          label: 'Événements',
          count: publications.filter((item) => item.contentType === 'events').length,
        },
        {
          value: 'parcels',
          label: 'Colis',
          count: publications.filter((item) => item.contentType === 'parcels').length,
        },
      ].filter((item) => item.value === 'all' || item.count > 0),
    [publications],
  )
  const visiblePublications =
    activeType === 'all'
      ? publications
      : publications.filter((item) => item.contentType === activeType)

  if (!publications.length) {
    return <EmptyState title="Aucune publication pour les modules activés" />
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
            {item.label} ({item.count})
          </button>
        ))}
      </div>
      {visiblePublications.map((item) => {
        const meta = statusMeta(item.status)
        const canPublish = ['archived', 'suspended', 'draft'].includes(item.status)
        const update = actions[item.contentType]
        return (
          <Card
            key={`${item.contentType}-${item.id}`}
            className="relative flex flex-wrap items-center gap-4"
          >
            <span className="absolute right-2 top-2 z-10">
              <Badge tone={meta.tone} className="!px-1.5 !py-0.5 !text-[9px]">{meta.label}</Badge>
            </span>
            {item.images?.[0] ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="hidden size-20 rounded-2xl object-cover sm:block"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <strong>{item.title || `${item.origin} vers ${item.destination}`}</strong>
              <p className="text-xs text-[var(--app-text-muted)]">{item.contentType}</p>
            </div>
            <Link to={`${contentPath[item.contentType]}/${item.id}`}>
              <Button variant="secondary">Voir</Button>
            </Link>
            {editPath[item.contentType] ? (
              <Link to={editPath[item.contentType](item.id)}>
                <Button variant="secondary">Modifier</Button>
              </Link>
            ) : null}
            {update ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => update(item.id, canPublish ? 'active' : 'suspended')}
                >
                  {canPublish ? 'Publier' : 'Suspendre'}
                </Button>
                <Button variant="danger" onClick={() => update(item.id, 'archived')}>
                  Archiver
                </Button>
              </>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
