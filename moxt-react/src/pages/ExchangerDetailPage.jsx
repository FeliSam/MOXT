import { FiClock, FiMapPin, FiRepeat, FiShield, FiStar } from 'react-icons/fi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
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
import { flagEmoji } from '../config/flags'
import { ContactButton } from '../features/communications/ContactButton'
import { ExchangerPickerAvatar } from '../features/transfers/ExchangerPickerAvatar'
import {
  businessToExchangerOption,
  exchangerMatchesUserCountry,
  resolveUserPartnerCountry,
  resolveUserTransferCountry,
} from '../features/transfers/exchangerListUtils'
import { FALLBACK_EXCHANGERS } from '../features/transfers/transferConfig'

export function ExchangerDetailPage() {
  const { exchangerId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')
  const partnerCountry = resolveUserPartnerCountry(user, originCountry)

  const business = useMemo(
    () =>
      businesses.find(
        (item) => item.id === exchangerId && item.services?.includes('Transfert'),
      ),
    [businesses, exchangerId],
  )

  const exchanger = useMemo(() => {
    if (business) {
      if (!exchangerMatchesUserCountry(business, partnerCountry, originCountry)) return null
      return businessToExchangerOption(business, resolveUserTransferCountry(user, originCountry), originCountry)
    }
    return FALLBACK_EXCHANGERS.find((item) => item.id === exchangerId) || null
  }, [business, exchangerId, originCountry, partnerCountry, user])

  if (!exchanger) {
    return (
      <EmptyState
        title="Échangeur introuvable"
        description="Ce partenaire n'est pas disponible pour votre pays d'origine."
      />
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Partenaire de transfert"
        title={exchanger.name}
        description={exchanger.description || 'Partenaire de change MOXT.'}
        actions={<BackButton fallback="/exchangers" />}
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
            label: 'Pays',
            value: `${flagEmoji(exchanger.country)} ${exchanger.city || exchanger.country}`,
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-start gap-4">
            <ExchangerPickerAvatar exchanger={exchanger} />
            <div className="min-w-0 flex-1">
              <VerifiedDisplayName
                as="h2"
                name={exchanger.name}
                verified={['verified', 'approved', 'active'].includes(exchanger.status)}
                iconSize="md"
                className="text-lg font-black"
              />
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {flagEmoji(exchanger.country)} {exchanger.city || exchanger.country}
              </p>
            </div>
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
              { label: 'Type', value: business ? 'Entreprise MOXT' : 'Partenaire MOXT' },
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
            business ? 'Profil entreprise présent dans MOXT.' : 'Profil partenaire vérifié sur MOXT.',
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
