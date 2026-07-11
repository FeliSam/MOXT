import {
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiInbox,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiStar,
  FiUsers,
} from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { activityByValue } from '../config/businessActivities'
import {
  calculateBusinessCompletion,
  calculateBusinessRating,
  selectBusinessContent,
} from '../features/businesses/businessSelectors'
import { DocumentsPanel } from './professional/DocumentsPanel'
import { MembersPanel } from './professional/MembersPanel'
import { Overview } from './professional/Overview'
import { ProfilePanel } from './professional/ProfilePanel'
import { PublicationsPanel } from './professional/PublicationsPanel'
import { RequestsPanel } from './professional/RequestsPanel'
import { ReviewsPanel } from './professional/ReviewsPanel'
import { StatisticsPanel } from './professional/StatisticsPanel'
import { TransfersPanel } from './professional/TransfersPanel'

const baseTabs = [
  { value: 'profile', label: 'Profil entreprise' },
  { value: 'overview', label: 'Aperçu' },
  { value: 'publications', label: 'Publications' },
  { value: 'requests', label: 'Demandes' },
  { value: 'documents', label: 'Documents' },
  { value: 'members', label: 'Membres' },
  { value: 'statistics', label: 'Statistiques' },
  { value: 'reviews', label: 'Avis' },
]

const serviceContentMap = {
  Marketplace: 'listings',
  Jobs: 'jobs',
  Events: 'events',
  Colis: 'parcels',
  P2P: 'offers',
}

export function ProfessionalPage() {
  const dispatch = useDispatch()
  const [active, setActive] = useState('profile')
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
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
  const transfers = useSelector((state) =>
    state.transfers.items.filter((item) => item.businessId === business?.id),
  )
  const reviews = useSelector((state) =>
    state.reviews.items.filter(
      (item) => item.targetType === 'business' && item.targetId === business?.id,
    ),
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
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moxt.local'
  const hasTransfers = enabledServices.includes('Transfert')
  const tabs = useMemo(
    () =>
      hasTransfers
        ? [...baseTabs.slice(0, 2), { value: 'transfers', label: 'Transferts' }, ...baseTabs.slice(2)]
        : baseTabs,
    [hasTransfers],
  )
  const safeActive = tabs.some((item) => item.value === active) ? active : 'profile'

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
        icon={FiBriefcase}
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
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Espace professionnel"
        title={business.name}
        description="Demandes, équipe, documents, publications et performances dans un espace adapté à votre activité."
        actions={
          <Link to={`/businesses/${business.id}`}>
            <Button variant="secondary">Voir la fiche publique</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Metric key={metric.label} value={metric.value} label={metric.label} icon={metric.icon} />
        ))}
      </div>

      <Tabs items={tabs} active={safeActive} onChange={setActive} />

      {safeActive === 'profile' ? (
        <ProfilePanel
          activity={activity}
          business={business}
          secondaryActivity={secondaryActivity}
          siteUrl={siteUrl}
        />
      ) : null}
      {safeActive === 'overview' ? (
        <Overview
          activity={activity}
          business={business}
          completion={completion}
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
        <DocumentsPanel business={business} documents={documents} dispatch={dispatch} />
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
    { icon: FiBriefcase, label: 'Profil complété', value: `${completion}%` },
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
