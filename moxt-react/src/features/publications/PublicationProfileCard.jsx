import { FiCalendar, FiEye, FiMapPin, FiStar, FiUser } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { Badge, VerifiedDisplayName } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ContactButton } from '../communications/ContactButton'
import { activityByValue } from '../../config/businessActivities'
import { useLanguage } from '../../contexts/useLanguage'
import { isBusinessPublishReady } from '../businesses/businessPublishUtils'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../share/businessShareUtils'
import { ProfileQrShareButton } from '../share/ProfileQrShareButton'
import { formatMemberSince } from './usePublicationProfile'

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
  const { t } = useLanguage()
  const memberSinceLabel = formatMemberSince(memberSince)
  const isBusinessScope = scope === 'business' && Boolean(ownBusiness)
  const businessVerified = isBusinessScope && isBusinessPublishReady(ownBusiness)
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

  const avatarNode =
    isBusinessScope && ownBusiness.logoUrl ? (
      <img
        src={ownBusiness.logoUrl}
        alt=""
        className="size-14 shrink-0 rounded-2xl object-cover sm:size-16"
        loading="lazy"
      />
    ) : !isBusinessScope && avatarUrl ? (
      <img
        src={avatarUrl}
        alt=""
        className="size-14 shrink-0 rounded-2xl object-cover sm:size-16"
        loading="lazy"
      />
    ) : (
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)] sm:size-16 sm:text-2xl">
        {headlineName.slice(0, 2).toUpperCase()}
      </span>
    )

  return (
    <Card className="min-w-0 overflow-hidden p-0">
      <div className="grid min-w-0 gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {avatarNode}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <VerifiedDisplayName
                as="h2"
                name={headlineName}
                verified={showVerifiedIcon}
                iconSize="md"
                className="min-w-0 text-lg font-black sm:text-xl"
                nameClassName="truncate"
              />
              {qrTargetPath ? (
                <ProfileQrShareButton
                  className="shrink-0 lg:hidden"
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
            <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
              <Badge tone="success" className="max-w-full truncate">
                {isBusinessScope ? (
                  <HiOutlineBuildingOffice2 className="mr-1 inline shrink-0" />
                ) : (
                  <FiUser className="mr-1 inline shrink-0" />
                )}
                {isBusinessScope
                  ? t('publications.profile.businessBadge')
                  : t('publications.profile.memberBadge')}
              </Badge>
              {isBusinessScope && displayName && displayName !== headlineName ? (
                <Badge tone="info" className="max-w-full min-w-0">
                  <FiUser className="mr-1 inline shrink-0" />
                  <VerifiedDisplayName
                    name={displayName}
                    verified={verified}
                    iconSize="sm"
                    className="min-w-0 inline-flex max-w-full"
                    nameClassName="truncate"
                  />
                </Badge>
              ) : null}
              {isBusinessScope && sectorLabel ? (
                <Badge tone="neutral" className="max-w-full truncate">
                  {sectorLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {memberSinceLabel ? (
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--app-text-muted)]">
            <FiCalendar className="shrink-0 text-brand-600" />
            <span className="min-w-0 truncate">
              {t('publications.profile.memberSince', { date: memberSinceLabel })}
            </span>
          </p>
        ) : null}
        {city ? (
          <p className="flex min-w-0 items-center gap-1 text-sm text-[var(--app-text-muted)]">
            <FiMapPin className="shrink-0" />
            <span className="min-w-0 truncate">
              {city}
              {country ? ` · ${country}` : ''}
            </span>
          </p>
        ) : null}

        <div className="scrollbar-hidden -mx-1 flex min-w-0 touch-pan-x gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
          <Badge tone="success" className="shrink-0 whitespace-nowrap">
            {t('publications.profile.activeCount', { count: activeCount })}
          </Badge>
          <Badge tone="info" className="shrink-0 whitespace-nowrap">
            {t('publications.profile.archivedCount', { count: archivedCount })}
          </Badge>
          <Badge tone="warning" className="shrink-0 whitespace-nowrap">
            {t('publications.profile.totalCount', { count: totalCount })}
          </Badge>
          {aggregateRating?.count ? (
            <Badge tone="warning" className="shrink-0 whitespace-nowrap">
              <FiStar className="mr-1 inline" />
              {t('publications.profile.reviewCount', {
                average: aggregateRating.average,
                count: aggregateRating.count,
              })}
            </Badge>
          ) : null}
          {totalViews > 0 || isOwner ? (
            <Badge tone="warning" className="shrink-0 whitespace-nowrap">
              <FiEye className="mr-1 inline" />
              {t('publications.profile.listingViews', { count: totalViews })}
            </Badge>
          ) : null}
        </div>

        {!isOwner && contactOwnerId ? (
          <ContactButton
            className="w-full sm:w-auto"
            ownerId={contactOwnerId}
            relatedEntity={contactEntity}
            relatedId={isBusinessScope ? ownBusiness?.id : shareUserId}
            relatedPath={contactPath}
            relatedTitle={contactTitle || headlineName}
            relatedType={contactType}
            variant="secondary"
          />
        ) : null}

        {qrTargetPath ? (
          <div className="hidden justify-end lg:flex">
            <ProfileQrShareButton
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
          </div>
        ) : null}
      </div>
    </Card>
  )
}
