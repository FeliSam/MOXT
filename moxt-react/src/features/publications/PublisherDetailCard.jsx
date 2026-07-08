import {
  FiCheckCircle,
  FiMessageSquare,
  FiShoppingBag,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatShortDate } from '../../utils/formatters'

export function PublisherDetailCard({
  business,
  className = '',
  publisherName,
  rating,
  publicationCount,
  countLabel = 'Annonces',
  contactCount = 0,
  description,
  descriptionFallback = 'Membre actif sur MOXT.',
  ownerId,
  shareCount = 0,
  updatedAt,
  ctaLabel = 'Voir toutes les publications',
  publicationsPath,
}) {
  const profilePath =
    publicationsPath || (ownerId ? `/users/${ownerId}/publications` : null)

  return (
    <Card className={`min-w-0 overflow-hidden ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)]">
          {publisherName?.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h2 className="font-black">{publisherName}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
            <FiCheckCircle className="text-emerald-500" />
            {business ? 'Entreprise MOXT' : 'Particulier'}
            {business && ['verified', 'approved', 'active'].includes(business.status) ? (
              <VerifiedBadge size="sm" />
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <PublisherStat
          icon={FiStar}
          value={`${rating?.average || business?.rating || 0}/5`}
          label="Note"
        />
        <PublisherStat icon={FiShoppingBag} value={publicationCount} label={countLabel} />
        <PublisherStat icon={FiMessageSquare} value={contactCount} label="Contacts" />
      </div>
      <p className="mt-5 text-sm leading-6 text-[var(--app-text-muted)]">
        {description || business?.description || descriptionFallback}
      </p>
      {business ? (
        <Link to={`/businesses/${business.id}`}>
          <Button className="mt-5 w-full" variant="secondary" icon={FiUser}>
            Voir la fiche entreprise
          </Button>
        </Link>
      ) : profilePath ? (
        <Link to={profilePath}>
          <Button className="mt-5 w-full" variant="secondary" icon={FiUser}>
            {ctaLabel}
          </Button>
        </Link>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--app-text-muted)]">
        <span>{shareCount} partage(s)</span>
        {updatedAt ? <span>Mis à jour le {formatShortDate(updatedAt)}</span> : null}
      </div>
    </Card>
  )
}

function PublisherStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3">
      <Icon className="mx-auto text-brand-600" />
      <strong className="mt-2 block">{value}</strong>
      <span className="text-[10px] text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
