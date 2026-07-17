import {
  FiCalendar,
  FiFileText,
  FiInbox,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiStar,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { flattenGroupedTabs, GroupedTabs } from '../components/ui/GroupedTabs'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { selectPublisherSubscribers } from '../features/account/subscriptionSelectors'
import { activityByValue } from '../config/businessActivities'
import { useLanguage } from '../contexts/useLanguage'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../features/share/businessShareUtils'
import { ProfileQrShareButton } from '../features/share/ProfileQrShareButton'
import {
  calculateBusinessCompletion,
  calculateBusinessRating,
  selectBusinessContent,
} from '../features/businesses/businessSelectors'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { businessesOptionLabel } from '../features/businesses/businessesI18n'
import { professionalText } from '../features/businesses/professionalI18n'
import { selectTransfersVisibleToUser } from '../features/transfers/transferSelectors'
import { isBusinessDocumentType } from '../features/businesses/businessDocumentTypes'
import { ActionsPanel } from './professional/ActionsPanel'
import { DocumentsPanel } from './professional/DocumentsPanel'
import { MembersPanel } from './professional/MembersPanel'
import { Overview } from './professional/Overview'
import { ProfilePanel } from './professional/ProfilePanel'
import { PublicationsPanel } from './professional/PublicationsPanel'
import { RequestsPanel } from './professional/RequestsPanel'
import { ReviewsPanel } from './professional/ReviewsPanel'
import { StatisticsPanel } from './professional/StatisticsPanel'
import { SubscriptionsPanel } from './professional/SubscriptionsPanel'
import { TransfersPanel } from './professional/TransfersPanel'

function buildProfessionalTabGroups({ hasTransfers, subscriberCount, reviewCount, pt }) {
  return [
    {
      id: 'identity',
      label: pt('professional.tabs.groups.identity'),
      tabs: [
        { value: 'profile', label: pt('professional.tabs.profile') },
        { value: 'overview', label: pt('professional.tabs.overview') },
      ],
    },
    {
      id: 'activity',
      label: pt('professional.tabs.groups.activity'),
      tabs: [
        { value: 'publications', label: pt('professional.tabs.publications') },
        { value: 'requests', label: pt('professional.tabs.requests') },
        ...(hasTransfers
          ? [{ value: 'transfers', label: pt('professional.tabs.transfers') }]
          : []),
      ],
    },
    {
      id: 'community',
      label: pt('professional.tabs.groups.community'),
      tabs: [
        {
          value: 'subscriptions',
          label: pt('professional.tabs.subscriptions'),
          count: subscriberCount,
        },
        {
          value: 'reviews',
          label: pt('professional.tabs.reviews'),
          count: reviewCount || undefined,
        },
        { value: 'members', label: pt('professional.tabs.members') },
      ],
    },
    {
      id: 'compliance',
      label: pt('professional.tabs.groups.compliance'),
      tabs: [{ value: 'documents', label: pt('professional.tabs.documents') }],
    },
    {
      id: 'insights',
      label: pt('professional.tabs.groups.insights'),
      tabs: [
        { value: 'statistics', label: pt('professional.tabs.statistics') },
        { value: 'actions', label: pt('professional.tabs.actions') },
      ],
    },
  ]
}

const serviceContentMap = {
  Marketplace: 'listings',
  Jobs: 'jobs',
  Events: 'events',
  Colis: 'parcels',
  P2P: 'offers',
}

export function ProfessionalPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const pt = useCallback((key, vars) => professionalText(t, key, vars), [t])
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState('profile')
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses.items, user.id),
  )
  const content = useSelector((state) => selectBusinessContent(state, business))
  const members = useSelector((state) =>
    state.businesses.members.filter((item) => item.businessId === business?.id),
  )
  const documents = useSelector((state) =>
    state.businesses.documents.filter((item) => item.businessId === business?.id),
  )
  const requests = useSelector((state) =>
    state.businesses.requests.filter((item) => item.businessId === business?.id),
  )
  const transfers = useSelector((state) => {
    const visible = selectTransfersVisibleToUser(state, user.id)
    if (!business?.id) return visible
    return visible.filter((item) => item.businessId === business.id)
  })
  const reviews = useSelector((state) =>
    state.reviews.items.filter(
      (item) => item.targetType === 'business' && item.targetId === business?.id,
    ),
  )
  const subscribers = useSelector((state) =>
    business?.id ? selectPublisherSubscribers(state, 'business', business.id) : [],
  )

  const enabledServices = useMemo(() => business?.services || [], [business])
  const enabledKeys = enabledServices.map((service) => serviceContentMap[service]).filter(Boolean)
  const publications = enabledKeys.flatMap((key) =>
    content[key].map((item) => ({ ...item, contentType: key })),
  )
  const completion = calculateBusinessCompletion(business, documents)
  const rating = calculateBusinessRating(reviews)
  const activity = activityByValue(business?.primaryActivity)
  const secondaryActivity = activityByValue(business?.secondaryActivity)
  const hasTransfers = enabledServices.includes('Transfert')
  const tabGroups = useMemo(
    () =>
      buildProfessionalTabGroups({
        hasTransfers,
        subscriberCount: subscribers.length,
        reviewCount: reviews.length,
        pt,
      }),
    [hasTransfers, pt, reviews.length, subscribers.length],
  )
  const tabs = useMemo(() => flattenGroupedTabs(tabGroups), [tabGroups])
  const safeActive = tabs.some((item) => item.value === active) ? active : 'profile'
  const documentCategory = searchParams.get('docType')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tabs.some((item) => item.value === tab)) {
      setActive(tab)
    }
  }, [searchParams, tabs])

  function handleTabChange(nextTab) {
    setActive(nextTab)
    const params = new URLSearchParams(searchParams)
    if (nextTab === 'profile') params.delete('tab')
    else params.set('tab', nextTab)
    setSearchParams(params, { replace: true })
  }

  const metrics = useMemo(
    () =>
      buildBusinessMetrics({
        activity,
        completion,
        content,
        enabledServices,
        publications,
        rating,
        requests,
        transfers,
        pt,
        t,
      }),
    [activity, completion, content, enabledServices, publications, pt, rating, requests, transfers, t],
  )

  if (!business) {
    return (
      <EmptyState
        icon={HiOutlineBuildingOffice2}
        title={pt('professional.page.emptyTitle')}
        description={pt('professional.page.emptyDescription')}
        action={
          <Link to="/businesses/setup">
            <Button>{pt('professional.page.createBusiness')}</Button>
          </Link>
        }
      />
    )
  }

  const activityLabel = businessesOptionLabel(t, activity) || business.sector

  return (
    <div className="grid min-w-0 max-w-full gap-7">
      <PageHeader
        eyebrow={pt('professional.page.eyebrow')}
        title={business.name}
        description={pt('professional.page.description')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
            <ReshareButton sourceType="business" sourceId={business.id} sourceData={business} />
            <Link to={`/businesses/${business.id}`}>
              <Button variant="secondary">{pt('professional.page.viewPublic')}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Metric key={metric.label} value={metric.value} label={metric.label} icon={metric.icon} />
        ))}
      </div>

      <GroupedTabs
        groups={tabGroups}
        active={safeActive}
        onChange={handleTabChange}
        label={pt('professional.page.tabsAria')}
      />

      {safeActive === 'profile' ? (
        <ProfilePanel
          activity={activity}
          business={business}
          documents={documents}
          secondaryActivity={secondaryActivity}
        />
      ) : null}
      {safeActive === 'overview' ? (
        <Overview
          activity={activity}
          business={business}
          documents={documents}
          members={members}
          publications={publications}
          requests={requests}
          transfers={transfers}
        />
      ) : null}
      {safeActive === 'requests' ? (
        <RequestsPanel business={business} dispatch={dispatch} requests={requests} />
      ) : null}
      {safeActive === 'transfers' && hasTransfers ? (
        <TransfersPanel business={business} transfers={transfers} dispatch={dispatch} user={user} />
      ) : null}
      {safeActive === 'publications' ? (
        <PublicationsPanel publications={publications} dispatch={dispatch} />
      ) : null}
      {safeActive === 'documents' ? (
        <DocumentsPanel
          business={business}
          documents={documents}
          dispatch={dispatch}
          initialCategory={isBusinessDocumentType(documentCategory) ? documentCategory : 'registration'}
        />
      ) : null}
      {safeActive === 'members' ? (
        <MembersPanel business={business} members={members} dispatch={dispatch} />
      ) : null}
      {safeActive === 'statistics' ? (
        <StatisticsPanel
          activity={activity}
          business={business}
          content={content}
          rating={rating}
          requests={requests}
          transfers={transfers}
        />
      ) : null}
      {safeActive === 'reviews' ? <ReviewsPanel reviews={reviews} /> : null}
      {safeActive === 'subscriptions' ? (
        <SubscriptionsPanel business={business} enabledServices={enabledServices} />
      ) : null}
      {safeActive === 'actions' ? <ActionsPanel business={business} /> : null}
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-11 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon />
      </span>
      <div>
        <strong className="block text-2xl">{value}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
      </div>
    </Card>
  )
}

function buildBusinessMetrics({
  activity,
  completion,
  content,
  enabledServices,
  publications,
  rating,
  requests,
  transfers,
  pt,
  t,
}) {
  const metrics = [
    {
      icon: HiOutlineBuildingOffice2,
      label: pt('professional.page.metrics.profileComplete'),
      value: `${completion}%`,
    },
    {
      icon: FiInbox,
      label: pt('professional.page.metrics.requests'),
      value: requests.length,
    },
    {
      icon: FiFileText,
      label: pt('professional.page.metrics.publications'),
      value: publications.length,
    },
  ]

  if (enabledServices.includes('Transfert')) {
    metrics.push({
      icon: FiRepeat,
      label: pt('professional.page.metrics.transfersReceived'),
      value: transfers.length,
    })
  } else if (enabledServices.includes('Events')) {
    metrics.push({
      icon: FiCalendar,
      label: pt('professional.page.metrics.events'),
      value: content.events.length,
    })
  } else if (enabledServices.includes('Jobs')) {
    metrics.push({
      icon: FiUsers,
      label: pt('professional.page.metrics.jobs'),
      value: content.jobs.length,
    })
  } else if (enabledServices.includes('Colis')) {
    metrics.push({
      icon: FiPackage,
      label: pt('professional.page.metrics.parcels'),
      value: content.parcels.length,
    })
  } else if (enabledServices.includes('Marketplace')) {
    metrics.push({
      icon: FiShoppingBag,
      label: pt('professional.page.metrics.listings'),
      value: content.listings.length,
    })
  }

  const activityLabel = businessesOptionLabel(t, activity)
  metrics.push({
    icon: FiStar,
    label: activityLabel
      ? pt('professional.page.metrics.reviewsWithActivity', { activity: activityLabel })
      : pt('professional.page.metrics.reviews'),
    value: rating.count ? `${rating.average}/5` : '—',
  })

  return metrics
}
