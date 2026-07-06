import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function Overview({
  activity,
  business,
  completion,
  documents,
  members,
  publications,
  requests,
  transfers,
}) {
  const modules = business.services || []
  const cards = buildOverviewCards({ business, documents, members, publications, requests, transfers })

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <h2 className="font-black">État de l’activité</h2>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${completion}%` }} />
        </div>
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          Complétion du profil : {completion}%
        </p>
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
        <h2 className="font-black">{activity?.label || 'Modules'} activés</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {modules.length ? (
            modules.map((module) => <Badge key={module}>{module}</Badge>)
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">Aucun module activé.</p>
          )}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--app-text-muted)]">
          {buildOverviewMessage(modules)}
        </p>
        <Link className="mt-6 inline-flex" to="/businesses/setup">
          <Button variant="secondary">Modifier le profil et les modules</Button>
        </Link>
      </Card>
    </div>
  )
}

function buildOverviewCards({ business, documents, members, publications, requests, transfers }) {
  const modules = business.services || []
  const cards = [
    ['Demandes ouvertes', requests.filter((item) => item.status !== 'completed').length],
    ['Publications actives', publications.filter((item) => item.status === 'active').length],
    ['Membres actifs', members.filter((item) => item.status === 'active').length],
    ['Documents', documents.length],
  ]

  if (modules.includes('Transfert')) {
    cards[1] = ['Transferts reçus', transfers.length]
  } else if (modules.includes('Events')) {
    cards[1] = ['Événements publiés', publications.filter((item) => item.contentType === 'events').length]
  } else if (modules.includes('Jobs')) {
    cards[1] = ['Offres publiées', publications.filter((item) => item.contentType === 'jobs').length]
  } else if (modules.includes('Colis')) {
    cards[1] = ['Voyages publiés', publications.filter((item) => item.contentType === 'parcels').length]
  } else if (modules.includes('Marketplace')) {
    cards[1] = ['Annonces publiées', publications.filter((item) => item.contentType === 'listings').length]
  }

  return cards
}

function buildOverviewMessage(modules) {
  if (modules.includes('Transfert')) {
    return 'Ce tableau de bord suit vos opérations, les paiements déclarés et vos paramètres de réception.'
  }
  if (modules.includes('Events')) {
    return 'Ce tableau de bord suit vos événements, la visibilité de votre agenda et les demandes liées.'
  }
  if (modules.includes('Jobs')) {
    return 'Ce tableau de bord suit vos offres, vos candidatures et votre rythme de publication.'
  }
  if (modules.includes('Colis')) {
    return 'Ce tableau de bord suit vos voyages, capacités disponibles et demandes de réservation.'
  }
  if (modules.includes('Marketplace')) {
    return 'Ce tableau de bord suit vos annonces, votre activité commerciale et la visibilité de vos contenus.'
  }
  return 'Ce tableau de bord s’adapte aux modules réellement activés par votre entreprise.'
}
