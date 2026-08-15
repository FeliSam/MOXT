import {
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
import { ExpandableLinkifiedText } from '../../components/ui/ExpandableLinkifiedText'
import { useLanguage } from '../../contexts/useLanguage'
import { isBusinessPublishReady } from '../businesses/businessPublishUtils'
import { formatShortDate } from '../../utils/formatters'

export function PublisherDetailCard({
  business,
  businessId,
  businessProfilePath,
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
  const directoryPath =
    businessProfilePath ||
    (businessId ? `/businesses/${businessId}` : null) ||
    (business?.id ? `/businesses/${business.id}` : null) ||
    (ownerBusiness?.id ? `/businesses/${ownerBusiness.id}` : null)
  const publisherVerified = business ? isBusinessPublishReady(business) : verified
  const profilePath =
    publicationsPath || (ownerId ? `/users/${ownerId}/publications` : null)
  const ratingDisplay =
    rating?.count > 0
      ? `${Number(rating.average || 0).toFixed(1)} (${rating.count})`
      : '—'
  return (
    <Card className={`min-w-0 overflow-hidden ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-lg font-black text-[var(--app-accent)] sm:size-14 sm:text-xl">
          {publisherName?.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <VerifiedDisplayName
            as="h2"
            name={publisherName}
            verified={publisherVerified}
            className="min-w-0 font-black"
            nameClassName="truncate"
            iconSize="md"
          />
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
            <FiCheckCircle className="text-emerald-500" />
            {business ? t('publications.publisher.businessMoxt') : t('publications.publisher.individual')}
          </p>
        </div>
      </div>
      <div className="mt-5 grid min-w-0 grid-cols-3 gap-1.5 text-center sm:gap-2">
        <PublisherStat
          icon={FiStar}
          value={ratingDisplay}
          label={t('publications.publisher.stats.rating')}
        />
        <PublisherStat icon={FiShoppingBag} value={publicationCount} label={resolvedCountLabel} />
        <PublisherStat icon={FiMessageSquare} value={contactCount} label={t('publications.publisher.stats.contacts')} />
      </div>
      <ExpandableLinkifiedText
        as="p"
        text={description || business?.description || resolvedDescriptionFallback}
        preserveWhitespace="pre-line"
        maxLines={4}
        className="mt-5 break-words text-sm leading-6 text-[var(--app-text-muted)]"
      />
      {directoryPath ? (
        <Link to={directoryPath}>
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
      <div className="mt-4 flex min-w-0 flex-col gap-1 text-xs text-[var(--app-text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 truncate">{t('publications.publisher.shares', { count: shareCount })}</span>
        {updatedAt ? (
          <span className="shrink-0">{t('publications.publisher.updatedAt', { date: formatShortDate(updatedAt) })}</span>
        ) : null}
      </div>
    </Card>
  )
}

function PublisherStat({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-2 sm:p-3">
      <Icon className="mx-auto text-brand-600" />
      <strong className="mt-2 block truncate text-sm sm:text-base">{value}</strong>
      <span className="block truncate text-[9px] text-[var(--app-text-muted)] sm:text-[10px]">{label}</span>
    </div>
  )
}
