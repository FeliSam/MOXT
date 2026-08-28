import {
  FiArrowLeft,
  FiCalendar,
  FiEye,
  FiLock,
  FiMapPin,
  FiShield,
  FiStar,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ExpandableLinkifiedText } from '../components/ui/ExpandableLinkifiedText'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import {
  DetailFacts,
  DetailSection,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { ReshareButton } from '../components/ui/ReshareButton'
import { activityByValue, businessExperienceForActivity } from '../config/businessActivities'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { ProfileQrShareButton } from '../features/share/ProfileQrShareButton'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../features/share/businessShareUtils'
import { selectBusinessById } from '../features/businesses/businessSelectors'
import { BusinessPublicationsPanel } from '../features/businesses/BusinessPublicationsPanel'
import { BusinessSubscriptionSection } from '../features/businesses/BusinessSubscriptionSection'
import { BusinessVerificationProgress } from '../features/businesses/BusinessVerificationProgress'
import { isStaffRole } from '../features/auth/roleUtils'
import { BusinessAdminActions } from '../features/businesses/BusinessAdminActions'
import { ContactButton } from '../features/communications/ContactButton'
import { BusinessActivityVisibilitySection } from '../features/businesses/BusinessActivityVisibilitySection'
import {
  businessesOptionLabel,
  businessesServiceLabel,
  businessesSpotlightLabel,
  businessesText,
} from '../features/businesses/businessesI18n'
import { canViewBusinessActivity } from '../features/account/activityVisibility'
import { useBusinessActivityVisibility } from '../features/businesses/useBusinessActivityVisibility'
import { useGuestAction } from '../features/guest/useGuestAction'
import { useGuestBusinessPreview } from '../features/guest/useGuestPreview'
import {
  buildBusinessPublicationProfile,
  collectBusinessPublications,
  publicationTotalCount,
} from '../features/publications/publicationCatalogUtils'
import { formatMemberSince } from '../features/publications/usePublicationProfile'
import { useScopedBusinessReviews } from '../features/reviews/useScopedTargetReviews'
import { ReviewsSection, REVIEW_TARGET_TYPES } from '../features/reviews/ReviewsSection'
import { calculateAggregateRating } from '@moxt/shared/utils/reviewUtils.js'

export function BusinessDetailPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const [searchParams, setSearchParams] = useSearchParams()
  const { businessId } = useParams()
  const { guestMode = false } = useOutletContext() || {}
  const { requireAccount } = useGuestAction()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const reduxBusiness = useSelector((state) => selectBusinessById(state, businessId))
  const guestPreview = useGuestBusinessPreview(guestMode ? businessId : null)
  const business = guestMode ? guestPreview.business : reduxBusiness
  const documents = useSelector((state) =>
    state.businesses.documents.filter((item) => item.businessId === businessId),
  )
  const marketplaceItems = useSelector((state) => state.marketplace.items)
  const parcelItems = useSelector((state) => state.parcels.items)
  const jobItems = useSelector((state) => state.jobs.items)
  const eventItems = useSelector((state) => state.events.items)
  const offerItems = useSelector((state) => state.p2p.offers)
  const videoItems = useSelector((state) => state.videos.items)

  const mainTab =
    searchParams.get('view') === 'informations'
      ? 'informations'
      : searchParams.get('view') === 'abonnements'
        ? 'abonnements'
        : searchParams.get('view') === 'avis'
          ? 'avis'
          : 'publications'

  const publications = useMemo(() => {
    if (guestMode) {
      return (
        guestPreview.publications || {
          listings: [],
          parcels: [],
          jobs: [],
          events: [],
          posts: [],
          others: [],
        }
      )
    }
    return collectBusinessPublications(
      {
        marketplace: { items: marketplaceItems },
        parcels: { items: parcelItems },
        jobs: { items: jobItems },
        events: { items: eventItems },
        p2p: { offers: offerItems },
        videos: { items: videoItems },
      },
      businessId,
    )
  }, [
    businessId,
    eventItems,
    guestMode,
    guestPreview.publications,
    jobItems,
    marketplaceItems,
    offerItems,
    parcelItems,
    videoItems,
  ])
  const publicationCount = publicationTotalCount(publications)
  const profile = useMemo(
    () => buildBusinessPublicationProfile(business, publications),
    [business, publications],
  )
  const memberSinceLabel = formatMemberSince(profile.memberSince)

  const isOwner = !guestMode && business?.ownerId === user?.id
  const isAdminViewer = isStaffRole(user)
  const { visibility, loading: visibilityLoading } = useBusinessActivityVisibility(
    business,
    user?.id,
  )
  const canView = guestMode
    ? !guestPreview.loading && !guestPreview.error && guestPreview.business
    : business &&
      canViewBusinessActivity({
        viewerId: user?.id,
        business: { ...business, activityVisibility: visibility },
        conversations,
      })

  const { reviews, rating: scopedRating } = useScopedBusinessReviews(businessId, publications, {
    enabled: Boolean(!guestMode && canView && businessId),
    ownerUserId: business?.ownerId,
  })
  const rating = guestMode
    ? calculateAggregateRating(guestPreview.reviews || [])
    : scopedRating
  const handleGuestInteract = () => requireAccount(bt('businesses.publications.guestInteract'))

  function setMainTab(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'publications') {
      params.delete('view')
    } else {
      params.set('view', next)
    }
    setSearchParams(params, { replace: true })
  }

  if (guestMode && guestPreview.loading) {
    return (
      <EmptyState
        title={bt('businesses.publications.loadingTitle')}
        description={bt('businesses.publications.loadingDescription')}
      />
    )
  }

  if (guestMode && guestPreview.error === 'not_found') {
    return (
      <EmptyState
        title={bt('businesses.publications.notFound')}
        description={bt('businesses.publications.notFoundDescription')}
        action={
          <Link to="/discover">
            <Button variant="secondary" icon={FiArrowLeft}>
              {bt('businesses.publications.discoverMoxt')}
            </Button>
          </Link>
        }
      />
    )
  }

  if (guestMode && (guestPreview.error === 'private' || guestPreview.error === 'contacts')) {
    return (
      <EmptyState
        icon={FiLock}
        title={bt('businesses.detail.notAccessible')}
        description={bt('businesses.publications.notAccessibleDescription')}
        action={
          <Link to="/register">
            <Button>{bt('businesses.publications.createAccount')}</Button>
          </Link>
        }
      />
    )
  }

  if (!isOwner && !guestMode && !visibilityLoading && business && !canView) {
    return (
      <EmptyState
        icon={FiLock}
        title={bt('businesses.detail.notAccessible')}
        description={bt('businesses.detail.restrictedVisibility')}
        action={
          <Link to="/businesses">
            <Button variant="secondary" icon={FiArrowLeft}>
              {bt('businesses.publications.backToDirectory')}
            </Button>
          </Link>
        }
      />
    )
  }

  if (!business) {
    return (
      <EmptyState
        title={bt('businesses.detail.notFoundPending')}
        description={guestMode ? bt('businesses.publications.notFoundDescription') : undefined}
      />
    )
  }

  const activity = activityByValue(business.primaryActivity)
  const experience = businessExperienceForActivity(business.primaryActivity)
  const hasTransfer = business.services?.includes('Transfert')
  const activityLabel = businessesOptionLabel(t, activity) || business.sector
  const spotlightKeys = experience.spotlightKeys || []
  const onboardingKeys = experience.onboardingKeys || []

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip sm:gap-7">
      {isOwner && !guestMode ? (
        <BusinessVerificationProgress business={business} documents={documents} />
      ) : null}
      <Card className="grid gap-6">
        <div className="relative">
          {business.bannerUrl ? (
            <img
              src={business.bannerUrl}
              alt={bt('businesses.detail.bannerAlt', { name: business.name })}
              className="h-44 w-full rounded-[1.8rem] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-44 w-full rounded-[1.8rem] bg-gradient-to-br from-brand-600 to-cyan-600" />
          )}
          <div className="absolute -bottom-8 left-5 z-10">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={bt('businesses.detail.logoAlt', { name: business.name })}
                className="size-16 rounded-3xl border-4 border-[var(--app-surface)] object-cover shadow-md"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-3xl border-4 border-[var(--app-surface)] bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)] shadow-md">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute right-4 top-4">
            <ProfileQrShareButton
              type="business"
              activityVisibility={business.activityVisibility}
              refreshKey={businessShareVersion(business)}
              shareUrl={buildBusinessShareUrl(business)}
              shareText={buildBusinessShareText(business)}
              title={business.name}
              subtitle={activityLabel}
              verified={['verified', 'approved', 'active'].includes(business.status)}
              city={businessCityLabel(business)}
              sector={activityLabel}
              logoUrl={business.logoUrl}
            />
          </div>
        </div>

        <div className="grid gap-4 pt-8">
          <VerifiedDisplayName
            as="h1"
            name={business.name}
            verified={['verified', 'approved', 'active'].includes(business.status)}
            iconSize="md"
            className="text-xl font-black sm:text-2xl"
          />
          <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
            <Badge tone="success" className="max-w-full truncate">
              <HiOutlineBuildingOffice2 className="mr-1 inline shrink-0" />
              {t('publications.profile.businessBadge')}
            </Badge>
            {activityLabel ? (
              <Badge tone="neutral" className="max-w-full truncate">
                {activityLabel}
              </Badge>
            ) : null}
            <Badge tone={statusMeta(business.status, t).tone}>
              {statusMeta(business.status, t).label}
            </Badge>
          </div>

          {memberSinceLabel ? (
            <p className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--app-text-muted)]">
              <FiCalendar className="shrink-0 text-brand-600" />
              <span className="min-w-0 truncate">
                {t('publications.profile.memberSince', { date: memberSinceLabel })}
              </span>
            </p>
          ) : null}

          <div className="scrollbar-hidden -mx-1 flex min-w-0 touch-pan-x gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
            <Badge tone="success" className="shrink-0 whitespace-nowrap">
              {t('publications.profile.activeCount', { count: profile.activeCount })}
            </Badge>
            <Badge tone="info" className="shrink-0 whitespace-nowrap">
              {t('publications.profile.archivedCount', { count: profile.archivedCount })}
            </Badge>
            <Badge tone="warning" className="shrink-0 whitespace-nowrap">
              {t('publications.profile.totalCount', { count: profile.totalCount })}
            </Badge>
            {rating.count ? (
              <Badge tone="warning" className="shrink-0 whitespace-nowrap">
                <FiStar className="mr-1 inline" />
                {t('publications.profile.reviewCount', {
                  average: rating.average,
                  count: rating.count,
                })}
              </Badge>
            ) : null}
            {profile.totalViews > 0 || isOwner ? (
              <Badge tone="warning" className="shrink-0 whitespace-nowrap">
                <FiEye className="mr-1 inline" />
                {t('publications.profile.listingViews', { count: profile.totalViews })}
              </Badge>
            ) : null}
          </div>

          <ExpandableLinkifiedText
            as="p"
            text={business.description}
            preserveWhitespace="pre-line"
            maxLines={4}
            className="max-w-3xl leading-7 text-[var(--app-text-muted)]"
          />
          <p className="flex items-center gap-2 text-sm">
            <FiMapPin className="text-brand-600" /> {business.city} · {business.country}
          </p>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-t border-[var(--app-border)] pt-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="flex shrink-0 items-center gap-2">
              {!guestMode ? (
                <ReshareButton
                  sourceType="business"
                  sourceId={business.id}
                  sourceData={business}
                  className="shrink-0"
                />
              ) : null}
              {!isOwner ? (
                <ContactButton
                  ownerId={business.ownerId}
                  relatedEntity={business}
                  relatedId={business.id}
                  relatedPath={`/businesses/${business.id}`}
                  relatedTitle={business.name}
                  relatedType="business"
                  iconOnly
                  className="!size-11 shrink-0"
                />
              ) : null}
            </div>
            {!isOwner && !guestMode ? (
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                publisherPath={`/businesses/${business.id}`}
                className="min-w-0"
              />
            ) : (
              <span className="hidden min-w-0 sm:block" aria-hidden />
            )}
            {guestMode ? (
              <Link to="/discover" className="col-span-2 min-w-0 sm:col-auto">
                <Button variant="secondary" icon={FiArrowLeft} className="w-full">
                  {bt('businesses.publications.discoverMoxt')}
                </Button>
              </Link>
            ) : (
              <Link to="/businesses" className="col-span-2 min-w-0 sm:col-auto">
                <Button variant="secondary" icon={HiOutlineBuildingOffice2} className="w-full sm:w-auto">
                  {bt('businesses.common.directory')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <CatalogArchiveTabs
        active={mainTab}
        onChange={setMainTab}
        variant="section"
        tabs={[
          {
            key: 'publications',
            label: bt('businesses.detail.tabs.publications'),
            count: publicationCount,
          },
          {
            key: 'avis',
            label: bt('businesses.detail.tabs.reviews'),
            count: rating.count,
            alwaysShow: true,
          },
          { key: 'informations', label: bt('businesses.detail.tabs.informations') },
          { key: 'abonnements', label: bt('businesses.detail.tabs.subscriptions') },
        ]}
      />

      {mainTab === 'publications' ? (
        <BusinessPublicationsPanel
          businessId={businessId}
          guestMode={guestMode}
          guestPublications={guestPreview.publications}
          isOwner={isOwner}
          onGuestInteract={handleGuestInteract}
        />
      ) : mainTab === 'informations' ? (
        <>
          {isOwner && !guestMode ? <BusinessActivityVisibilitySection business={business} /> : null}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <DetailSection title={bt('businesses.detail.professionalInfo')}>
              <DetailFacts
                items={[
                  { label: bt('businesses.common.sector'), value: activityLabel },
                  { label: bt('businesses.common.country'), value: business.country },
                  { label: bt('businesses.common.city'), value: business.city },
                  { label: bt('businesses.common.phone'), value: business.phone },
                  ...(hasTransfer
                    ? [
                        {
                          label: bt('businesses.detail.feeAnnounced'),
                          value: `${business.feePercent}%`,
                        },
                        {
                          label: bt('businesses.detail.averageDelay'),
                          value: business.averageDelay,
                        },
                      ]
                    : []),
                  ...(!hasTransfer && business.averageDelay
                    ? [
                        {
                          label: bt('businesses.detail.averageDelay'),
                          value: business.averageDelay,
                        },
                      ]
                    : []),
                ]}
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {(business.services || []).map((service) => (
                  <Badge key={service}>{businessesServiceLabel(t, service)}</Badge>
                ))}
              </div>
            </DetailSection>
          </div>
          {isAdminViewer && !guestMode ? (
            <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-black">
                    <FiShield className="text-brand-700" />
                    {bt('businesses.detail.adminTitle')}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                    {bt('businesses.detail.adminDescription')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BusinessAdminActions business={business} dispatch={dispatch} t={t} />
                </div>
              </div>
            </Card>
          ) : null}
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <DetailSection title={bt('businesses.detail.spotlightTitle')}>
              <div className="grid gap-3 sm:grid-cols-2">
                {spotlightKeys.map((itemKey) => (
                  <div key={itemKey} className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm">
                    <strong className="block">{businessesSpotlightLabel(t, itemKey)}</strong>
                    <span className="mt-1 block text-[var(--app-text-muted)]">
                      {resolveBusinessSpotlightValue(business, itemKey, bt)}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
            <DetailSection title={bt('businesses.detail.aboutActivity')}>
              <p className="text-sm leading-7 text-[var(--app-text-muted)]">
                {experience.audienceKey
                  ? businessesText(t, experience.audienceKey)
                  : experience.audience}
              </p>
              <div className="mt-4 grid gap-3">
                {onboardingKeys.map((itemKey, index) => (
                  <div key={itemKey} className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm">
                    {businessesText(t, itemKey) || experience.onboarding[index]}
                  </div>
                ))}
              </div>
            </DetailSection>
          </div>
        </>
      ) : mainTab === 'abonnements' ? (
        <BusinessSubscriptionSection
          business={business}
          enabledServices={business.services || []}
          isOwner={isOwner}
        />
      ) : (
        <ReviewsSection
          embedded
          ownerId={business.ownerId}
          ownerName={business.name}
          profileTargetType={REVIEW_TARGET_TYPES.BUSINESS}
          profileTargetId={business.id}
          reviews={guestMode ? guestPreview.reviews || [] : reviews}
          currentUser={user}
        />
      )}
    </div>
  )
}

function resolveBusinessSpotlightValue(business, itemKey, bt) {
  switch (itemKey) {
    case 'feeAnnounced':
      return business.feePercent
        ? `${business.feePercent}%`
        : bt('businesses.common.toConfirm')
    case 'averageDelay':
    case 'handlingDelay':
    case 'responseDelay':
      return business.averageDelay || bt('businesses.common.toConfirm')
    case 'activeNetworks':
      return (
        business.exchangeMethods?.join(', ') ||
        bt('businesses.spotlight.value.perOperation')
      )
    case 'serviceZone':
    case 'zones':
    case 'zone':
    case 'delivery':
      return business.serviceZones || business.city || bt('businesses.common.russia')
    case 'capacity':
      return bt('businesses.spotlight.value.parcelCapacity')
    case 'catalog':
    case 'activeProperties':
    case 'programs':
    case 'workshops':
    case 'services':
    case 'activeOffers':
    case 'upcomingEvents':
      return bt('businesses.spotlight.value.linkedPublications')
    case 'availability':
    case 'schedule':
      return business.scheduleSummary || bt('businesses.spotlight.value.directContact')
    case 'contact':
    case 'hrContact':
      return business.phone || business.email || bt('businesses.common.toComplete')
    case 'city':
      return business.city || bt('businesses.common.moxt')
    default:
      return business.city || bt('businesses.common.moxt')
  }
}
