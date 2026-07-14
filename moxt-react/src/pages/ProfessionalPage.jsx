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
import { useEffect, useMemo, useState } from 'react'
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

function buildProfessionalTabGroups({ hasTransfers, subscriberCount, reviewCount }) {
  return [
    {
      id: 'identity',
      label: 'Identité',
      tabs: [
        { value: 'profile', label: 'Profil' },
        { value: 'overview', label: 'Aperçu' },
      ],
    },
    {
      id: 'activity',
      label: 'Activité',
      tabs: [
        { value: 'publications', label: 'Publications' },
        { value: 'requests', label: 'Demandes' },
        ...(hasTransfers ? [{ value: 'transfers', label: 'Transferts' }] : []),
      ],
    },
    {
      id: 'community',
      label: 'Communauté',
      tabs: [
        { value: 'subscriptions', label: 'Abonnements', count: subscriberCount },
        { value: 'reviews', label: 'Avis', count: reviewCount || undefined },
        { value: 'members', label: 'Membres' },
      ],
    },
    {
      id: 'compliance',
      label: 'Conformité',
      tabs: [{ value: 'documents', label: 'Documents' }],
    },
    {
      id: 'insights',
      label: 'Pilotage',
      tabs: [
        { value: 'statistics', label: 'Statistiques' },
        { value: 'actions', label: 'Actions' },
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
    business?.id
      ? selectPublisherSubscribers(state, 'business', business.id)
      : [],
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
      }),
    [hasTransfers, reviews.length, subscribers.length],
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
      }),
    [activity, completion, content, enabledServices, publications, rating, requests, transfers],
  )

  if (!business) {
    return (
      <EmptyState
        icon={HiOutlineBuildingOffice2}
        title="Créez votre entreprise"
        description="Un profil professionnel est nécessaire pour regrouper et piloter vos publications."
        action={
          <Link to="/businesses/setup">
            <Button>Créer mon entreprise</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid min-w-0 max-w-full gap-7">
      <PageHeader
        eyebrow="Espace professionnel"
        title={business.name}
        description="Demandes, équipe, documents, publications et performances dans un espace adapté à votre activité."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ProfileQrShareButton
              type="business"
              activityVisibility={business.activityVisibility}
              refreshKey={businessShareVersion(business)}
              shareUrl={buildBusinessShareUrl(business)}
              shareText={buildBusinessShareText(business)}
              title={business.name}
              subtitle={activity?.label || business.sector}
              verified={['verified', 'approved', 'active'].includes(business.status)}
              city={businessCityLabel(business)}
              sector={activity?.label || business.sector}
              logoUrl={business.logoUrl}
            />
            <ReshareButton sourceType="business" sourceId={business.id} sourceData={business} />
            <Link to={`/businesses/${business.id}`}>
              <Button variant="secondary">Voir la fiche publique</Button>
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
        label="Sections de l'espace professionnel"
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
}) {
  const metrics = [
    { icon: HiOutlineBuildingOffice2, label: 'Profil complété', value: `${completion}%` },
    { icon: FiInbox, label: 'Demandes', value: requests.length },
    { icon: FiFileText, label: 'Publications', value: publications.length },
  ]

  if (enabledServices.includes('Transfert')) {
    metrics.push({ icon: FiRepeat, label: 'Transferts reçus', value: transfers.length })
  } else if (enabledServices.includes('Events')) {
    metrics.push({ icon: FiCalendar, label: 'Événements', value: content.events.length })
  } else if (enabledServices.includes('Jobs')) {
    metrics.push({ icon: FiUsers, label: 'Jobs', value: content.jobs.length })
  } else if (enabledServices.includes('Colis')) {
    metrics.push({ icon: FiPackage, label: 'Colis', value: content.parcels.length })
  } else if (enabledServices.includes('Marketplace')) {
    metrics.push({ icon: FiShoppingBag, label: 'Annonces', value: content.listings.length })
  }

  metrics.push({
    icon: FiStar,
    label: activity?.label ? `Avis ${activity.label}` : 'Avis',
    value: rating.count ? `${rating.average}/5` : '—',
  })

  return metrics
}
