import {
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { activityByValue, businessExperienceForActivity } from '../config/businessActivities'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { ProfileQrShareButton } from '../features/share/ProfileQrShareButton'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../features/share/businessShareUtils'
import { selectBusinessContent } from '../features/businesses/businessSelectors'
import { BusinessSubscriptionSection } from '../features/businesses/BusinessSubscriptionSection'
import { BusinessVerificationProgress } from '../features/businesses/BusinessVerificationProgress'
import { isBusinessVisibleToViewer } from '../features/businesses/businessVisibility'
import { isStaffRole } from '../features/auth/roleUtils'
import { moderateBusiness } from '../features/businesses/businessSlice'
import { ContactButton } from '../features/communications/ContactButton'
import { BusinessActivityVisibilitySection } from '../features/businesses/BusinessActivityVisibilitySection'
import {
  businessesOptionLabel,
  businessesServiceLabel,
  businessesSpotlightLabel,
  businessesText,
} from '../features/businesses/businessesI18n'
import { canViewBusinessActivity } from '../features/account/activityVisibility'
import { selectBusinessReviewsBundle } from '../features/reviews/reviewSelectors'
import { ReviewsSection, REVIEW_TARGET_TYPES } from '../features/reviews/ReviewsSection'

const SERVICE_SECTION_DEFS = [
  { key: 'listings', labelKey: 'businesses.services.listings', icon: FiShoppingBag, service: 'Marketplace' },
  { key: 'jobs', labelKey: 'businesses.services.jobs', icon: FiBriefcase, service: 'Jobs' },
  { key: 'events', labelKey: 'businesses.services.eventsLabel', icon: FiCalendar, service: 'Events' },
  { key: 'parcels', labelKey: 'businesses.services.colis', icon: FiPackage, service: 'Colis' },
]

export function BusinessDetailPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const [detailTab, setDetailTab] = useState('informations')
  const { businessId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.id === businessId),
  )
  const content = useSelector((state) => selectBusinessContent(state, business))
  const documents = useSelector((state) =>
    state.businesses.documents.filter((item) => item.businessId === businessId),
  )
  const { reviews, rating } = useSelector((state) =>
    selectBusinessReviewsBundle(state, business),
  )

  const isOwner = business?.ownerId === user.id
  const isAdminViewer = isStaffRole(user)
  const canView =
    business &&
    canViewBusinessActivity({
      viewerId: user?.id,
      business,
      conversations,
    })
  const canPreview =
    business &&
    canView &&
    isBusinessVisibleToViewer(business, user) &&
    (isOwner || isAdminViewer || ['verified', 'approved', 'active'].includes(business?.status))

  if (!business || !canPreview) {
    return (
      <EmptyState
        title={
          business && !canView
            ? bt('businesses.detail.notAccessible')
            : bt('businesses.detail.notFoundPending')
        }
        description={
          business && !canView ? bt('businesses.detail.restrictedVisibility') : undefined
        }
      />
    )
  }

  const activity = activityByValue(business.primaryActivity)
  const experience = businessExperienceForActivity(business.primaryActivity)
  const hasTransfer = business.services?.includes('Transfert')
  const ratingValue = rating.count ? rating.average : business.rating || 0
  const serviceSections = SERVICE_SECTION_DEFS.map((section) => ({
    ...section,
    label: bt(section.labelKey),
  }))
  const sections = serviceSections.filter(
    ({ key, service }) => business.services?.includes(service) || content[key]?.length,
  )
  const activityLabel = businessesOptionLabel(t, activity) || business.sector
  const spotlightKeys = experience.spotlightKeys || []
  const onboardingKeys = experience.onboardingKeys || []

  const metricItems = [
    {
      icon: FiStar,
      label: bt('businesses.detail.reviewsCount', { count: rating.count }),
      value: `${ratingValue}/5`,
    },
    { icon: FiShield, label: bt('businesses.common.status'), value: statusMeta(business.status, t).label },
    { icon: FiMapPin, label: bt('businesses.common.location'), value: business.city },
    {
      icon: HiOutlineBuildingOffice2,
      label: bt('businesses.common.publications'),
      value: `${Object.values(content).reduce((total, items) => total + items.length, 0)}`,
    },
  ]

  if (hasTransfer) {
    metricItems.splice(1, 0, {
      icon: HiOutlineBuildingOffice2,
      label: bt('businesses.detail.feeAnnounced'),
      value: `${business.feePercent}%`,
    })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={
          <VerifiedDisplayName
            name={business.name}
            verified={['verified', 'approved', 'active'].includes(business.status)}
            iconSize="md"
          />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReshareButton sourceType="business" sourceId={business.id} sourceData={business} />
            {!isOwner ? (
              <FavoriteButton
                relatedId={business.id}
                relatedType="business"
                title={business.name}
                path={`/businesses/${business.id}`}
                entity={business}
                className="!w-auto !shadow-none"
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
              />
            ) : null}
            <BackButton fallback="/businesses" label={bt('businesses.common.directory')} />
          </div>
        }
      />
      {isOwner ? (
        <BusinessVerificationProgress business={business} documents={documents} />
      ) : null}
      <DetailMetrics items={metricItems} />
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta(business.status, t).tone}>{statusMeta(business.status, t).label}</Badge>
          </div>
          <p className="max-w-3xl whitespace-pre-line leading-7 text-[var(--app-text-muted)]">
            {business.description}
          </p>
          <div className="rounded-[1.5rem] bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
            <strong className="block text-[var(--app-text)]">{activityLabel}</strong>
            <span>
              {experience.promiseKey
                ? businessesText(t, experience.promiseKey)
                : experience.promise}
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm">
            <FiMapPin className="text-brand-600" /> {business.city} · {business.country}
          </p>
          <div className="flex flex-wrap gap-3">
            <ContactButton
              ownerId={business.ownerId}
              relatedEntity={business}
              relatedId={business.id}
              relatedPath={`/businesses/${business.id}`}
              relatedTitle={business.name}
              relatedType="business"
            />
            {!isOwner ? (
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                publisherPath={`/businesses/${business.id}`}
              />
            ) : null}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map(({ icon: Icon, key, label }) => (
          <Card key={key}>
            <Icon className="text-2xl text-brand-600" />
            <strong className="mt-4 block text-2xl">{content[key].length}</strong>
            <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
            <Link
              className="mt-4 block text-sm font-bold text-brand-700 dark:text-brand-300"
              to={`/businesses/${business.id}/publications/${key}`}
            >
              {bt('businesses.common.consult')}
            </Link>
          </Card>
        ))}
      </div>
      <CatalogArchiveTabs
        active={detailTab}
        onChange={setDetailTab}
        variant="section"
        className="!grid-cols-3 sm:!inline-flex"
        tabs={[
          { key: 'informations', label: bt('businesses.detail.tabs.informations') },
          { key: 'abonnements', label: bt('businesses.detail.tabs.subscriptions') },
          { key: 'avis', label: bt('businesses.detail.tabs.reviews'), count: rating.count },
        ]}
      />
      {detailTab === 'informations' ? (
        <>
          {isOwner ? <BusinessActivityVisibilitySection business={business} /> : null}
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
          {isAdminViewer ? (
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
                  <Button onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'verified' }))}>
                    {bt('businesses.detail.validate')}
                  </Button>
                  <Button variant="secondary" onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'active' }))}>
                    {bt('businesses.detail.activate')}
                  </Button>
                  <Button variant="danger" onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'rejected' }))}>
                    {bt('businesses.detail.reject')}
                  </Button>
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
          {sections.length ? (
            <div className="grid gap-4">
              <div>
                <h2 className="text-2xl font-black">{bt('businesses.detail.linkedPublications')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {bt('businesses.detail.linkedPublicationsHint')}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {sections.map(({ icon: Icon, key, label }) => (
                  <Link key={key} to={`/businesses/${business.id}/publications/${key}`}>
                    <Card className="h-full">
                      <Icon className="text-2xl text-brand-600" />
                      <strong className="mt-4 block text-xl">{label}</strong>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                        {bt('businesses.detail.publishedItems', { count: content[key].length })}
                      </p>
                      <div className="mt-4">
                        {content[key][0]?.images?.[0] ? (
                          <img
                            src={content[key][0].images[0]}
                            alt={content[key][0].title || label}
                            className="h-36 w-full rounded-[1.25rem] object-cover"
                          />
                        ) : (
                          <div className="grid h-36 place-items-center rounded-[1.25rem] bg-[var(--app-surface-muted)] text-sm text-[var(--app-text-muted)]">
                            {bt('businesses.detail.viewPublishedList')}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : detailTab === 'abonnements' ? (
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
          reviews={reviews}
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
