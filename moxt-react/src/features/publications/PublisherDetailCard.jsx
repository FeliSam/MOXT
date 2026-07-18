import {
  FiBriefcase,
  FiCheckCircle,
  FiMessageSquare,
  FiShoppingBag,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { VerifiedDisplayName } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { isBusinessPublishReady } from '../businesses/businessPublishUtils'
import { formatShortDate } from '../../utils/formatters'

export function PublisherDetailCard({
  business,
  className = '',
  ownerBusiness,
  publisherName,
  rating,
  publicationCount,
  countLabel,
  contactCount = 0,
  description,
  descriptionFallback,
  ownerId,
  shareCount = 0,
  updatedAt,
  ctaLabel,
  publicationsPath,
  verified = false,
}) {
  const { t } = useLanguage()
  const resolvedCountLabel = countLabel ?? t('publications.publisher.stats.publications')
  const resolvedDescriptionFallback =
    descriptionFallback ?? t('publications.publisher.descriptionFallback')
  const resolvedCtaLabel = ctaLabel ?? t('publications.publisher.viewAllPublications')
  const publisherVerified = business ? isBusinessPublishReady(business) : verified
  const profilePath =
    publicationsPath || (ownerId ? `/users/${ownerId}/publications` : null)

  return (
    <Card className={`min-w-0 overflow-hidden ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)]">
          {publisherName?.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <VerifiedDisplayName
            as="h2"
            name={publisherName}
            verified={publisherVerified}
            className="font-black"
            iconSize="md"
          />
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
            <FiCheckCircle className="text-emerald-500" />
            {business ? t('publications.publisher.businessMoxt') : t('publications.publisher.individual')}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <PublisherStat
          icon={FiStar}
          value={`${rating?.average || business?.rating || 0}/5`}
          label={t('publications.publisher.stats.rating')}
        />
        <PublisherStat icon={FiShoppingBag} value={publicationCount} label={resolvedCountLabel} />
        <PublisherStat icon={FiMessageSquare} value={contactCount} label={t('publications.publisher.stats.contacts')} />
      </div>
      <p className="mt-5 text-sm leading-6 text-[var(--app-text-muted)]">
        {description || business?.description || resolvedDescriptionFallback}
      </p>
      {business ? (
        <Link to={`/businesses/${business.id}`}>
          <Button className="mt-5 w-full" variant="secondary" icon={FiUser}>
            {t('publications.publisher.viewBusinessProfile')}
          </Button>
        </Link>
      ) : profilePath ? (
        <Link to={profilePath}>
          <Button className="mt-5 w-full" variant="secondary" icon={FiUser}>
            {resolvedCtaLabel}
          </Button>
        </Link>
      ) : null}
      {!business && ownerBusiness ? (
        <Link to={`/businesses/${ownerBusiness.id}/publications/listings`}>
          <Button className="mt-3 w-full" variant="secondary" icon={FiBriefcase}>
            {t('publications.publisher.viewBusiness')}
          </Button>
        </Link>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--app-text-muted)]">
        <span>{t('publications.publisher.shares', { count: shareCount })}</span>
        {updatedAt ? (
          <span>{t('publications.publisher.updatedAt', { date: formatShortDate(updatedAt) })}</span>
        ) : null}
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
