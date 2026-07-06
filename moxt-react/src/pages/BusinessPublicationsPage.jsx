import { FiArrowLeft, FiBriefcase, FiCalendar, FiPackage, FiShoppingBag } from 'react-icons/fi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { activityByValue } from '../config/businessActivities'
import { statusMeta } from '../config/statuses'
import {
  selectBusinessById,
  selectBusinessContent,
} from '../features/businesses/businessSelectors'

const contentMeta = {
  listings: {
    label: 'Annonces',
    icon: FiShoppingBag,
    detailPath: '/marketplace',
    empty: 'Aucune annonce publiée pour cette entreprise.',
  },
  jobs: {
    label: 'Jobs',
    icon: FiBriefcase,
    detailPath: '/jobs',
    empty: 'Aucune offre publiée pour cette entreprise.',
  },
  events: {
    label: 'Événements',
    icon: FiCalendar,
    detailPath: '/events',
    empty: 'Aucun événement publié pour cette entreprise.',
  },
  parcels: {
    label: 'Colis',
    icon: FiPackage,
    detailPath: '/parcels',
    empty: 'Aucune annonce colis publiée pour cette entreprise.',
  },
}

export function BusinessPublicationsPage() {
  const { businessId, contentType } = useParams()
  const business = useSelector((state) => selectBusinessById(state, businessId))
  const content = useSelector((state) => selectBusinessContent(state, business))
  const meta = contentMeta[contentType]
  const items = useMemo(() => (meta ? content[contentType] || [] : []), [content, contentType, meta])
  const activity = activityByValue(business?.primaryActivity)

  if (!business || !meta) {
    return <EmptyState title="Publication introuvable" />
  }

  const Icon = meta.icon

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Publications de l'entreprise"
        title={`${meta.label} - ${business.name}`}
        description={`${activity?.label || business.sector} · ${business.city}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to={`/businesses/${business.id}`}>
              <Button variant="secondary" icon={FiArrowLeft}>
                Fiche publique
              </Button>
            </Link>
            <Link to="/businesses">
              <Button variant="secondary">Annuaire</Button>
            </Link>
          </div>
        }
      />
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <Icon className="text-xl" />
          </span>
          <div>
            <strong className="block text-lg">{meta.label}</strong>
            <p className="text-sm text-[var(--app-text-muted)]">
              {items.length} publication(s) visibles pour cette entreprise.
            </p>
          </div>
        </div>
        <Badge tone="info">{statusMeta(business.status).label}</Badge>
      </Card>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} to={`${meta.detailPath}/${item.id}`}>
              <Card className="relative h-full overflow-hidden transition hover:-translate-y-0.5">
                <span className="absolute right-2 top-2 z-10">
                  <Badge tone={statusMeta(item.status).tone} className="!px-1.5 !py-0.5 !text-[9px]">{statusMeta(item.status).label}</Badge>
                </span>
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-44 w-full rounded-[1.5rem] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="grid h-44 place-items-center rounded-[1.5rem] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                    <Icon className="text-3xl" />
                  </div>
                )}
                <div className="mt-4">
                  <div className="min-w-0">
                    <strong className="block text-lg">
                      {item.title || `${item.origin} → ${item.destination}`}
                    </strong>
                    <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                      {item.city || item.location || business.city || 'Russie'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Stat label="Publication" value={item.publishedAt || item.createdAt || 'Locale'} />
                  <Stat
                    label="Prix"
                    value={
                      item.price
                        ? `${item.price} ${item.currency || 'RUB'}`
                        : item.salary
                          ? `${item.salary} ${item.currency || 'RUB'}`
                          : item.pricePerKg
                            ? `${item.pricePerKg} ${item.currency || 'RUB'}`
                            : 'Voir détail'
                    }
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={meta.empty} />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
        {label}
      </p>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  )
}
