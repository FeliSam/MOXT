import {
  FiArrowLeft,
  FiLock,
  FiMapPin,
  FiShield,
} from 'react-icons/fi'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ExpandableLinkifiedText } from '../components/ui/ExpandableLinkifiedText'
import {
  DetailFacts,
  DetailSection,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { activityByValue, businessExperienceForActivity } from '../config/businessActivities'
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
import { PublicProfileHero } from '../features/publications/PublicProfileHero'
import { PublicProfileTabs } from '../features/publications/PublicProfileTabs'
import { PublicVideoThumbGrid } from '../features/publications/PublicVideoThumbGrid'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { formatMemberSince } from '../features/publications/usePublicationProfile'
import { useScopedBusinessReviews } from '../features/reviews/useScopedTargetReviews'
import { ReviewsSection, REVIEW_TARGET_TYPES } from '../features/reviews/ReviewsSection'
import { calculateAggregateRating } from '@moxt/shared/utils/reviewUtils.js'
import { isActiveVideo } from '../features/videos/videoUtils'
import { phase3Text } from '../i18n/phase3I18n'

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

  const p3 = (key, vars) => phase3Text(t, key, vars)
  const viewParam = searchParams.get('view')
  const mainTab =
    viewParam === 'informations' || viewParam === 'abonnements' || viewParam === 'avis'
      ? viewParam
      : viewParam === 'videos' || viewParam === 'produits' || viewParam === 'publications'
        ? viewParam === 'publications'
          ? 'produits'
          : viewParam
        : 'apercu'

  const publications = useMemo(() => {
    if (guestMode) {
      return (
        guestPreview.publications || {
          listings: [],
          parcels: [],
          jobs: [],
          events: [],
          videos: [],
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
    if (next === 'apercu') {
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
  const cityLabel = businessCityLabel(business) || business.city
  const activeVideos = (publications.videos || []).filter(isActiveVideo)
  const activeListings = (publications.listings || []).filter(
    (item) => !item?.status || item.status === 'active',
  )
  const verified = ['verified', 'approved', 'active'].includes(business.status)

  const videosTab = {
    key: 'videos',
    label: bt('businesses.detail.tabs.videos'),
    count: activeVideos.length,
    alwaysShow: true,
  }
  const produitsTab = {
    key: 'produits',
    label: bt('businesses.detail.tabs.products'),
    count: activeListings.length || publicationCount,
    alwaysShow: true,
  }
  // =1 vidéo : Vidéos, Produits, Avis, À propos — sinon Produits, Vidéos, Avis, À propos
  const publicTabs = [
    ...(activeVideos.length > 0 ? [videosTab, produitsTab] : [produitsTab, videosTab]),
    {
      key: 'avis',
      label: bt('businesses.detail.tabs.reviews'),
      count: rating.count,
      alwaysShow: true,
    },
    { key: 'apercu', label: bt('businesses.detail.tabs.overview'), alwaysShow: true },
  ]
  if (isOwner && !guestMode) {
    publicTabs.push(
      { key: 'informations', label: bt('businesses.detail.tabs.informations'), alwaysShow: true },
      { key: 'abonnements', label: bt('businesses.detail.tabs.subscriptions'), alwaysShow: true },
    )
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip bg-[var(--app-surface)] sm:gap-6">
      {isOwner && !guestMode ? (
        <BusinessVerificationProgress business={business} documents={documents} />
      ) : null}

      <PublicProfileHero
        name={business.name}
        verified={verified}
        category={activityLabel}
        city={cityLabel}
        coverUrl={business.bannerUrl}
        avatarUrl={business.logoUrl}
        coverAlt={bt('businesses.detail.bannerAlt', { name: business.name })}
        avatarAlt={bt('businesses.detail.logoAlt', { name: business.name })}
        rating={rating}
        reviewsLabel={p3('publications.public.reviewsShort')}
        shareSlot={
          <ProfileQrShareButton
            type="business"
            activityVisibility={business.activityVisibility}
            refreshKey={businessShareVersion(business)}
            shareUrl={buildBusinessShareUrl(business)}
            shareText={buildBusinessShareText(business)}
            title={business.name}
            subtitle={activityLabel}
            verified={verified}
            city={cityLabel}
            sector={activityLabel}
            logoUrl={business.logoUrl}
          />
        }
        actions={
          !isOwner ? (
            <>
              {guestMode ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => requireAccount(bt('businesses.publications.guestInteract'))}
                >
                  {p3('publications.public.follow')}
                </Button>
              ) : (
                <SubscribeButton
                  publisherType="business"
                  publisherId={business.id}
                  publisherName={business.name}
                  publisherPath={`/businesses/${business.id}`}
                  className="w-full"
                  variant="secondary"
                  showIcon={false}
                  subscribeLabel={p3('publications.public.follow')}
                  subscribedLabel={p3('publications.public.following')}
                />
              )}
              <ContactButton
                ownerId={business.ownerId}
                relatedEntity={business}
                relatedId={business.id}
                relatedPath={`/businesses/${business.id}`}
                relatedTitle={business.name}
                relatedType="business"
                showIcon={false}
                className="w-full"
                variant="primary"
              />
            </>
          ) : (
            <>
              <Link to="/businesses" className="col-span-2 min-w-0 sm:col-span-1">
                <Button variant="secondary" className="w-full">
                  {bt('businesses.common.directory')}
                </Button>
              </Link>
              <Link
                to={`/publications/mine?scope=business`}
                className="col-span-2 min-w-0 sm:col-span-1"
              >
                <Button className="w-full">{p3('publications.user.manage')}</Button>
              </Link>
            </>
          )
        }
      />

      <PublicProfileTabs active={mainTab} onChange={setMainTab} tabs={publicTabs} />

      {mainTab === 'apercu' ? (
        <div className="grid gap-5">
          {business.description ? (
            <section className="grid gap-2">
              <h2 className="text-base font-black">{p3('publications.public.overviewAbout')}</h2>
              <ExpandableLinkifiedText
                as="p"
                text={business.description}
                preserveWhitespace="pre-line"
                maxLines={6}
                className="leading-7 text-[var(--app-text-muted)]"
              />
            </section>
          ) : null}
          {cityLabel || business.country ? (
            <p className="flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
              <FiMapPin className="shrink-0 text-brand-700" />
              {[cityLabel, business.country].filter(Boolean).join(' Â· ')}
            </p>
          ) : null}
          {activeVideos.length ? (
            <PublicVideoThumbGrid
              videos={activeVideos.slice(0, 4)}
              title={p3('publications.public.videosTitle')}
              guestMode={guestMode}
              onGuestInteract={handleGuestInteract}
            />
          ) : null}
          {activeListings.length ? (
            <section className="grid gap-4">
              <h2 className="text-base font-black">{bt('businesses.detail.tabs.products')}</h2>
              <CatalogGrid lazy={false}>
                {activeListings.slice(0, 4).map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    listing={listing}
                    guestMode={guestMode}
                    onGuestInteract={handleGuestInteract}
                  />
                ))}
              </CatalogGrid>
            </section>
          ) : null}
          {memberSinceLabel ? (
            <p className="text-xs text-[var(--app-text-faint)]">
              {t('publications.profile.memberSince', { date: memberSinceLabel })}
            </p>
          ) : null}
        </div>
      ) : mainTab === 'videos' ? (
        <PublicVideoThumbGrid
          videos={activeVideos}
          title={p3('publications.public.videosTitle')}
          emptyTitle={p3('publications.public.videosEmpty')}
          emptyDescription={p3('publications.public.videosEmptyDescription')}
          guestMode={guestMode}
          onGuestInteract={handleGuestInteract}
        />
      ) : mainTab === 'produits' ? (
        activeListings.length ? (
          <CatalogGrid lazy={false}>
            {activeListings.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                guestMode={guestMode}
                onGuestInteract={handleGuestInteract}
              />
            ))}
          </CatalogGrid>
        ) : (
          <BusinessPublicationsPanel
            businessId={businessId}
            guestMode={guestMode}
            guestPublications={guestPreview.publications}
            isOwner={isOwner}
            onGuestInteract={handleGuestInteract}
          />
        )
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
