import { FiCheckCircle, FiClock, FiCreditCard, FiRepeat, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
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
import { ContactButton } from '../features/communications/ContactButton'
import { acceptOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee } from '../features/p2p/p2pUtils'
import { formatMoney } from '../features/transfers/transferUtils'

export function P2PDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offerId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const offer = useSelector((state) => state.p2p.offers.find((item) => item.id === offerId))

  if (!offer) return <EmptyState title="Offre P2P introuvable" />

  function accept() {
    const action = dispatch(acceptOffer({ buyer: user, offer }))
    if (action.payload?.id) navigate(`/p2p/orders/${action.payload.id}`)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={offer.id}
        title={`${formatMoney(offer.amount, offer.fromCurrency)} vers ${offer.toCurrency}`}
        description={`Offre publiée par ${offer.ownerName}`}
        actions={<BackButton fallback="/p2p" />}
      />
      <DetailMetrics
        items={[
          {
            icon: FiRepeat,
            label: 'Conversion',
            value: `${offer.fromCurrency} → ${offer.toCurrency}`,
          },
          { icon: FiCreditCard, label: 'Méthode', value: offer.method },
          { icon: FiClock, label: 'Statut', value: offer.status },
          { icon: FiUser, label: 'Proposé par', value: offer.ownerName },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">Conditions de l’offre</h2>
            <Badge tone={offer.status === 'active' ? 'success' : 'warning'}>{offer.status}</Badge>
          </div>
          <div className="mt-5 grid gap-3 text-sm">
            <Row label="Montant proposé" value={formatMoney(offer.amount, offer.fromCurrency)} />
            <Row label="Devise recherchée" value={offer.toCurrency} />
            <Row label="Taux" value={offer.rate} />
            <Row label="Méthode" value={offer.method} />
            <Row
              label="Frais estimés"
              value={formatMoney(
                calculateP2PFee(offer.amount, offer.fromCurrency),
                offer.fromCurrency,
              )}
            />
          </div>
          {offer.comment ? (
            <p className="mt-5 rounded-xl bg-[var(--app-surface-muted)] p-4 text-sm">
              {offer.comment}
            </p>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-black">Contacter ou accepter</h2>
          <div className="mt-5 grid gap-3">
            <ContactButton
              ownerId={offer.ownerId}
              relatedEntity={offer}
              relatedId={offer.id}
              relatedPath={`/p2p/${offer.id}`}
              relatedTitle={`${offer.fromCurrency} vers ${offer.toCurrency}`}
              relatedType="p2p"
              variant="secondary"
            />
            {offer.status === 'active' && offer.ownerId !== user.id ? (
              <Button icon={FiCheckCircle} onClick={accept}>
                Accepter l’offre
              </Button>
            ) : null}
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--app-text-muted)]">
            L’acceptation crée une transaction locale. Aucun paiement réel n’est déclenché.
          </p>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Détails de l’échange">
          <DetailFacts
            items={[
              { label: 'Montant disponible', value: formatMoney(offer.amount, offer.fromCurrency) },
              { label: 'Devise demandée', value: offer.toCurrency },
              { label: 'Taux proposé', value: offer.rate },
              {
                label: 'Frais',
                value: formatMoney(
                  calculateP2PFee(offer.amount, offer.fromCurrency),
                  offer.fromCurrency,
                ),
              },
              { label: 'Méthode', value: offer.method },
              { label: 'Profil', value: offer.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Référence', value: offer.id },
            ]}
          />
        </DetailSection>
        <TrustPanel
          title="Sécurité P2P"
          items={[
            'Cette opération est traitée via MOXT. Restez vigilant et conservez vos preuves.',
            'Conservez les preuves dans la conversation.',
            'Confirmez les montants avant toute remise réelle.',
          ]}
        />
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--app-border)] pb-3">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
