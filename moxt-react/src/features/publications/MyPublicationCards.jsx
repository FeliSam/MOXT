import {
  FiBriefcase,
  FiCalendar,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiPackage,
  FiRotateCcw,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { statusMeta } from '../../config/statuses'
import { formatMoney } from '../transfers/transferUtils'
import { isActiveEvent, isActiveJob, isActiveParcel, isActivePost, archivedPublicationCardClass } from './publicationCatalogUtils'

function PublicationCardShell({
  archived = false,
  icon: Icon,
  tone,
  badge,
  title,
  subtitle,
  meta,
  path,
  actions,
}) {
  return (
    <Card className={`overflow-hidden p-0 ${archived ? archivedPublicationCardClass : ''}`}>
      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          className={`relative flex h-40 w-full shrink-0 items-center justify-center bg-gradient-to-br lg:h-auto lg:w-48 ${tone} ${
            archived ? 'opacity-75 saturate-[0.85]' : ''
          }`}
        >
          <Icon className="text-4xl text-white opacity-90" />
          <div className="absolute left-3 top-3">{badge}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="text-lg font-black">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm font-semibold text-brand-700">{subtitle}</p>
            ) : null}
            {meta?.length ? (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--app-text-muted)]">
                {meta.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={path}>
              <Button variant="secondary" icon={FiExternalLink} size="sm">
                Ouvrir
              </Button>
            </Link>
            {actions}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function MyParcelPublicationCard({ parcel, readOnly = false, onArchive, onReactivate }) {
  const status = statusMeta(parcel.status)
  const active = isActiveParcel(parcel)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiPackage}
      tone="from-sky-600 to-blue-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={`${parcel.origin} → ${parcel.destination}`}
      subtitle={
        parcel.pricePerKg != null
          ? `${formatMoney(parcel.pricePerKg, parcel.currency)} / kg`
          : null
      }
      meta={[
        parcel.departureDate ? `Départ ${parcel.departureDate}` : null,
        parcel.remainingKg != null ? `${parcel.remainingKg} kg restants` : null,
      ].filter(Boolean)}
      path={`/parcels/${parcel.id}`}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/parcels/${parcel.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                Modifier
              </Button>
            </Link>
            {active ? (
              <Button variant="danger" icon={FiRotateCcw} size="sm" onClick={onArchive}>
                Clôturer
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                Réactiver
              </Button>
            )}
          </>
        )
      }
    />
  )
}

export function MyJobPublicationCard({ job, readOnly = false, onArchive, onReactivate }) {
  const status = statusMeta(job.status)
  const active = isActiveJob(job)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiBriefcase}
      tone="from-violet-600 to-purple-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={job.title}
      subtitle={job.salary}
      meta={[job.publisherName, job.location, job.contractType].filter(Boolean)}
      path={`/jobs/${job.id}`}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/jobs/${job.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                Modifier
              </Button>
            </Link>
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                Archiver
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                Republier
              </Button>
            )}
          </>
        )
      }
    />
  )
}

export function MyEventPublicationCard({ event, readOnly = false, onArchive, onReactivate }) {
  const status = statusMeta(event.status)
  const active = isActiveEvent(event)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiCalendar}
      tone="from-amber-600 to-orange-700"
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      title={event.title}
      subtitle={event.price > 0 ? formatMoney(event.price, event.currency) : 'Gratuit'}
      meta={[event.city, event.startAt || event.date].filter(Boolean)}
      path={`/events/${event.id}`}
      actions={
        readOnly ? null : (
          <>
            <Link to={`/events/${event.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                Modifier
              </Button>
            </Link>
            {active ? (
              <Button variant="danger" size="sm" onClick={onArchive}>
                Archiver
              </Button>
            ) : (
              <Button icon={FiRotateCcw} size="sm" onClick={onReactivate}>
                Republier
              </Button>
            )}
          </>
        )
      }
    />
  )
}

export function MyPostPublicationCard({ post, readOnly = false, onDelete }) {
  const active = isActivePost(post)
  return (
    <PublicationCardShell
      archived={!active}
      icon={FiFileText}
      tone="from-slate-600 to-slate-800"
      badge={<Badge tone="info">Publication</Badge>}
      title={post.message?.slice(0, 80) || 'Publication'}
      subtitle={post.sourceType !== 'free' ? post.sourceType : null}
      meta={[`${post.likes?.length || 0} j'aime`, `${post.comments?.length || 0} commentaires`]}
      path="/news"
      actions={
        readOnly ? null : (
          <>
            <Link to={`/news/${post.id}/edit`}>
              <Button variant="secondary" icon={FiEdit2} size="sm">
                Modifier
              </Button>
            </Link>
            {onDelete ? (
              <Button variant="danger" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            ) : null}
          </>
        )
      }
    />
  )
}

/** @deprecated Utiliser MyEventPublicationCard ou MyPostPublicationCard */
export function MyOtherPublicationCard({ entry, readOnly, onArchive, onReactivate, onDelete }) {
  if (entry.kind === 'event') {
    return (
      <MyEventPublicationCard
        event={entry.item}
        readOnly={readOnly}
        onArchive={onArchive}
        onReactivate={onReactivate}
      />
    )
  }
  return <MyPostPublicationCard post={entry.item} readOnly={readOnly} onDelete={onDelete} />
}
