import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { BusinessVerificationProgress } from '../../features/businesses/BusinessVerificationProgress'
import { professionalText } from '../../features/businesses/professionalI18n'

export function Overview({
  activity,
  business,
  documents,
  members,
  publications,
  requests,
  transfers,
}) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const modules = business.services || []
  const cards = buildOverviewCards({
    business,
    documents,
    members,
    publications,
    requests,
    transfers,
    pt,
  })

  return (
    <div className="grid gap-5">
      <BusinessVerificationProgress business={business} documents={documents} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <h2 className="font-black">{pt('professional.overview.activityState')}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--app-surface-muted)] p-4">
              <strong className="text-xl">{value}</strong>
              <p className="text-xs text-[var(--app-text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-black">
          {pt('professional.overview.modulesActivated', {
            label: activity?.label || pt('professional.overview.modulesFallback'),
          })}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {modules.length ? (
            modules.map((module) => <Badge key={module}>{module}</Badge>)
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              {pt('professional.overview.noModules')}
            </p>
          )}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--app-text-muted)]">
          {buildOverviewMessage(modules, pt)}
        </p>
        <Link className="mt-6 inline-flex" to="/businesses/setup">
          <Button variant="secondary">{pt('professional.overview.editProfile')}</Button>
        </Link>
      </Card>
    </div>
    </div>
  )
}

function buildOverviewCards({ business, documents, members, publications, requests, transfers, pt }) {
  const modules = business.services || []
  const cards = [
    [pt('professional.overview.cards.openRequests'), requests.filter((item) => item.status !== 'completed').length],
    [pt('professional.overview.cards.activePublications'), publications.filter((item) => item.status === 'active').length],
    [pt('professional.overview.cards.activeMembers'), members.filter((item) => item.status === 'active').length],
    [pt('professional.overview.cards.documents'), documents.length],
  ]

  if (modules.includes('Transfert')) {
    cards[1] = [pt('professional.overview.cards.transfersReceived'), transfers.length]
  } else if (modules.includes('Events')) {
    cards[1] = [
      pt('professional.overview.cards.publishedEvents'),
      publications.filter((item) => item.contentType === 'events').length,
    ]
  } else if (modules.includes('Jobs')) {
    cards[1] = [
      pt('professional.overview.cards.publishedJobs'),
      publications.filter((item) => item.contentType === 'jobs').length,
    ]
  } else if (modules.includes('Colis')) {
    cards[1] = [
      pt('professional.overview.cards.publishedParcels'),
      publications.filter((item) => item.contentType === 'parcels').length,
    ]
  } else if (modules.includes('Marketplace')) {
    cards[1] = [
      pt('professional.overview.cards.publishedListings'),
      publications.filter((item) => item.contentType === 'listings').length,
    ]
  }

  return cards
}

function buildOverviewMessage(modules, pt) {
  if (modules.includes('Transfert')) {
    return pt('professional.overview.message.transfert')
  }
  if (modules.includes('Events')) {
    return pt('professional.overview.message.events')
  }
  if (modules.includes('Jobs')) {
    return pt('professional.overview.message.jobs')
  }
  if (modules.includes('Colis')) {
    return pt('professional.overview.message.colis')
  }
  if (modules.includes('Marketplace')) {
    return pt('professional.overview.message.marketplace')
  }
  return pt('professional.overview.message.default')
}
