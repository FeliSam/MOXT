import { FiBriefcase, FiCalendar, FiEye, FiMapPin, FiStar, FiUser } from 'react-icons/fi'
import { Badge, VerifiedDisplayName } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ContactButton } from '../communications/ContactButton'
import { activityByValue } from '../../config/businessActivities'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../share/businessShareUtils'
import { ProfileQrShareButton } from '../share/ProfileQrShareButton'
import { formatMemberSince } from './usePublicationProfile'

function isBusinessVerified(business) {
  return ['verified', 'approved', 'active'].includes(business?.status)
}

export function PublicationProfileCard({
  displayName,
  verified = false,
  memberSince,
  city,
  country,
  activeCount,
  archivedCount,
  totalCount,
  totalViews,
  aggregateRating,
  isOwner = false,
  scope,
  ownBusiness,
  shareUserId,
  avatarUrl,
  contactOwnerId,
  contactPath,
  contactTitle,
  contactEntity,
  contactType = 'profile',
}) {
  const memberSinceLabel = formatMemberSince(memberSince)
  const isBusinessScope = scope === 'business' && Boolean(ownBusiness)
  const businessVerified = isBusinessScope && isBusinessVerified(ownBusiness)
  const headlineName = isBusinessScope ? ownBusiness.name : displayName
  const showVerifiedIcon = isBusinessScope ? businessVerified : verified
  const sectorLabel = isBusinessScope
    ? activityByValue(ownBusiness.primaryActivity)?.label || ownBusiness.sector
    : ''
  const qrTargetPath = isBusinessScope
    ? `/businesses/${ownBusiness.id}/publications/listings`
    : shareUserId
      ? `/users/${shareUserId}/publications`
      : null

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
        {isBusinessScope && ownBusiness.logoUrl ? (
          <img
            src={ownBusiness.logoUrl}
            alt=""
            className="size-16 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid size-16 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-2xl font-black text-[var(--app-accent)]">
            {headlineName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedDisplayName
              as="h2"
              name={headlineName}
              verified={showVerifiedIcon}
              iconSize="md"
              className="text-xl font-black"
            />
            <Badge tone="success">
              {isBusinessScope ? (
                <FiBriefcase className="mr-1 inline" />
              ) : (
                <FiUser className="mr-1 inline" />
              )}
              {isBusinessScope ? 'Entreprise' : 'Membre'}
            </Badge>
            {isBusinessScope && displayName && displayName !== headlineName ? (
              <Badge tone="info">
                <FiUser className="mr-1 inline" />
                {displayName}
              </Badge>
            ) : null}
            {isBusinessScope && sectorLabel ? (
              <Badge tone="neutral">{sectorLabel}</Badge>
            ) : null}
          </div>
          {memberSinceLabel ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--app-text-muted)]">
              <FiCalendar className="shrink-0 text-brand-600" />
              Membre depuis : {memberSinceLabel}
            </p>
          ) : null}
          {city ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-[var(--app-text-muted)]">
              <FiMapPin />
              {city}
              {country ? ` · ${country}` : ''}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">{activeCount} actives</Badge>
            <Badge tone="info">{archivedCount} archivées</Badge>
            <Badge tone="warning">{totalCount} au total</Badge>
            {aggregateRating?.count ? (
              <Badge tone="warning">
                <FiStar className="mr-1 inline" />
                {aggregateRating.average}/5 · {aggregateRating.count} avis
              </Badge>
            ) : null}
            {totalViews > 0 || isOwner ? (
              <Badge tone="warning">
                <FiEye className="mr-1 inline" />
                {totalViews} vues annonces
              </Badge>
            ) : null}
          </div>
          {!isOwner && contactOwnerId ? (
            <div className="mt-4">
              <ContactButton
                ownerId={contactOwnerId}
                relatedEntity={contactEntity}
                relatedId={isBusinessScope ? ownBusiness?.id : shareUserId}
                relatedPath={contactPath}
                relatedTitle={contactTitle || headlineName}
                relatedType={contactType}
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
        {qrTargetPath ? (
          <ProfileQrShareButton
            className="justify-self-end sm:col-start-3 sm:row-span-2 sm:self-start"
            type={isBusinessScope ? 'business' : 'user'}
            activityVisibility={isBusinessScope ? ownBusiness?.activityVisibility : undefined}
            targetPath={!isBusinessScope ? qrTargetPath : undefined}
            refreshKey={isBusinessScope ? businessShareVersion(ownBusiness) : undefined}
            shareUrl={isBusinessScope ? buildBusinessShareUrl(ownBusiness) : undefined}
            shareText={isBusinessScope ? buildBusinessShareText(ownBusiness) : undefined}
            title={headlineName}
            subtitle={isBusinessScope ? sectorLabel || ownBusiness.sector : displayName}
            verified={showVerifiedIcon}
            city={isBusinessScope ? businessCityLabel(ownBusiness) : city}
            sector={isBusinessScope ? sectorLabel || ownBusiness.sector : undefined}
            logoUrl={isBusinessScope ? ownBusiness.logoUrl : avatarUrl}
          />
        ) : null}
      </div>
    </Card>
  )
}
