import { FiArrowLeft, FiClock, FiMapPin, FiRepeat, FiShield, FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { ContactButton } from '../features/communications/ContactButton'
import { FALLBACK_EXCHANGERS } from '../features/transfers/transferConfig'

export function ExchangerDetailPage() {
  const { exchangerId } = useParams()
  const business = useSelector((state) =>
    state.businesses.items.find(
      (item) => item.id === exchangerId && item.services?.includes('Transfert'),
    ),
  )
  const exchanger = business || FALLBACK_EXCHANGERS.find((item) => item.id === exchangerId)

  if (!exchanger) return <EmptyState title="Échangeur introuvable" />

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Partenaire de transfert"
        title={exchanger.name}
        description={exchanger.description || 'Partenaire de démonstration MOXT.'}
        actions={
          <Link to="/exchangers">
            <Button variant="secondary" icon={FiArrowLeft}>
              Retour
            </Button>
          </Link>
        }
      />
      <DetailMetrics
        items={[
          { icon: FiStar, label: 'Évaluation', value: `${exchanger.rating || 0}/5` },
          {
            icon: FiClock,
            label: 'Délai moyen',
            value: exchanger.averageDelay || 'À confirmer',
          },
          {
            icon: FiRepeat,
            label: 'Frais',
            value: `${exchanger.feePercent ?? 2.5}%`,
          },
          {
            icon: FiMapPin,
            label: 'Localisation',
            value: exchanger.city || 'Service en ligne',
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap gap-2">
            {business && ['verified', 'approved', 'active'].includes(business.status) ? (
              <Badge tone="info">Vérifié</Badge>
            ) : null}
            <Badge tone="success">Disponible</Badge>
            <Badge>{business ? 'Entreprise MOXT' : 'Donnée de démonstration'}</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric icon={FiStar} value={`${exchanger.rating || 0}/5`} label="Évaluation" />
            <Metric
              icon={FiClock}
              value={exchanger.averageDelay || 'À confirmer'}
              label="Délai moyen"
            />
            <Metric
              icon={FiRepeat}
              value={`${exchanger.feePercent ?? 2.5}%`}
              label="Frais annoncés"
            />
          </div>
          {exchanger.methods?.length ? (
            <div className="mt-6">
              <h2 className="font-black">Moyens pris en charge</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {exchanger.methods.map((method) => (
                  <Badge key={method}>{method}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
        <Card>
          <FiShield className="text-3xl text-brand-600" />
          <h2 className="mt-4 font-black">Démarrer une opération</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
            Les taux et coordonnées seront recalculés et contrôlés par le futur backend.
          </p>
          <div className="mt-5 grid gap-3">
            <Link to={`/transfers?exchangerId=${exchanger.id}`}>
              <Button className="w-full" icon={FiRepeat}>
                Choisir cet échangeur
              </Button>
            </Link>
            {business ? (
              <ContactButton
                ownerId={business.ownerId}
                relatedEntity={business}
                relatedId={business.id}
                relatedPath={`/exchangers/${business.id}`}
                relatedTitle={business.name}
                relatedType="business"
                variant="secondary"
              />
            ) : null}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations du partenaire">
          <DetailFacts
            items={[
              { label: 'Nom', value: exchanger.name },
              { label: 'Type', value: business ? 'Entreprise MOXT' : 'Démonstration' },
              { label: 'Disponibilité', value: 'Disponible' },
              { label: 'Délai moyen', value: exchanger.averageDelay },
              { label: 'Frais annoncés', value: `${exchanger.feePercent ?? 2.5}%` },
              {
                label: 'Méthodes',
                value: exchanger.methods?.join(', ') || 'À confirmer',
              },
            ]}
          />
        </DetailSection>
        <TrustPanel
          items={[
            business ? 'Profil entreprise présent dans MOXT.' : 'Profil de démonstration locale.',
            'Les taux définitifs seront contrôlés par le futur backend.',
            'Aucun transfert réel n’est exécuté dans cette version.',
          ]}
        />
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-[var(--app-surface-muted)] p-4">
      <Icon className="text-brand-600" />
      <strong className="mt-3 block">{value}</strong>
      <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}
