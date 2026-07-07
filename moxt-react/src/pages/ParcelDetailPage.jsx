import { useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBox, FiCalendar, FiDownload, FiEdit2, FiMapPin, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { ContactButton } from '../features/communications/ContactButton'
import {
  requestParcelReservation,
  updateParcelProofStatus,
  updateParcelRequestStatus,
} from '../features/parcels/parcelSlice'
import { addToast } from '../features/ui/uiSlice'
import { statusMeta } from '../config/statuses'
import { formatMoney } from '../features/transfers/transferUtils'

export function ParcelDetailPage() {
  const [kg, setKg] = useState(1)
  const dispatch = useDispatch()
  const { parcelId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const parcel = useSelector((state) => state.parcels.items.find((item) => item.id === parcelId))
  const requests = useSelector((state) =>
    state.parcels.requests.filter((item) => item.parcelId === parcelId),
  )

  if (!parcel) return <Card>Voyage introuvable.</Card>

  const depositDeadline = parcel.depositDeadline || parcel.departureDate
  const canReserve = parcel.status === 'active' && user.id !== parcel.ownerId
  const isAdmin = ['admin', 'superadmin'].includes(user.role)
  const canSeeProof = isAdmin || user.id === parcel.ownerId
  const proofMeta = statusMeta(parcel.proofStatus)
  const ownRequest = requests.find(
    (item) => item.userId === user.id && !['rejected', 'cancelled'].includes(item.status),
  )
  const kgError =
    !Number.isFinite(kg) || kg <= 0
      ? 'Indiquez un poids valide.'
      : kg > parcel.remainingKg
        ? `Maximum disponible : ${parcel.remainingKg} kg.`
        : null

  function handleSendRequest() {
    if (kgError) return
    dispatch(
      requestParcelReservation({
        parcelId: parcel.id,
        userId: user.id,
        requesterName: `${user.firstName} ${user.lastName}`,
        ownerId: parcel.ownerId,
        businessId: parcel.businessId,
        kg,
      }),
    )
  }

  function handleRequestStatus(request, status) {
    dispatch(updateParcelRequestStatus({ id: request.id, status }))
    dispatch(
      addToast({
        title: status === 'approved' ? 'Demande acceptée' : 'Demande refusée',
        message: `${request.requesterName} · ${request.kg} kg`,
        tone: status === 'approved' ? 'success' : 'error',
      }),
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={parcel.id}
        title={`${parcel.origin} vers ${parcel.destination}`}
        description={`Départ le ${parcel.departureDate} · dépôt avant ${depositDeadline}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReshareButton sourceType="parcel" sourceId={parcel.id} sourceData={parcel} />
            {user.id === parcel.ownerId ? (
              <Link to={`/parcels/${parcelId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>Modifier</Button>
              </Link>
            ) : null}
            <Link to="/parcels">
              <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
            </Link>
          </div>
        }
      />

      {/* Route visuelle origine -> destination */}
      <div className="relative rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        {parcel.proofStatus ? (
          <span className="absolute -top-3 right-3 z-10">
            <Badge tone={proofMeta.tone} className="!px-1.5 !py-0.5 !text-[9px]">
              {parcel.proofStatus === 'verified' ? 'Preuve vérifiée' : proofMeta.label}
            </Badge>
          </span>
        ) : null}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-faint)]">Origine</p>
            <p className="mt-1 truncate text-lg font-black sm:text-xl">{parcel.origin}</p>
            {parcel.originAirportCode ? (
              <p className="text-xs font-bold text-[var(--app-text-muted)]">{parcel.originAirportCode}</p>
            ) : null}
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
            <FiArrowRight />
          </span>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-faint)]">Destination</p>
            <p className="mt-1 truncate text-lg font-black sm:text-xl">{parcel.destination}</p>
            {parcel.destinationAirportCode ? (
              <p className="text-xs font-bold text-[var(--app-text-muted)]">{parcel.destinationAirportCode}</p>
            ) : null}
          </div>
        </div>
      </div>

      <DetailMetrics
        items={[
          { icon: FiBox, label: 'Capacité restante', value: `${parcel.remainingKg} kg` },
          { icon: FiCalendar, label: 'Départ', value: parcel.departureDate },
          { icon: FiCalendar, label: 'Dépôt limite', value: depositDeadline },
          {
            icon: FiMapPin,
            label: 'Trajet',
            value: `${parcel.origin} → ${parcel.destination}`,
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <FiBox className="text-3xl text-brand-700" />
          <h2 className="mt-4 text-xl font-black">{parcel.remainingKg} kg disponibles</h2>
          <p className="mt-2 text-sm text-slate-500">
            {formatMoney(parcel.pricePerKg, parcel.currency)} par kilogramme
          </p>
          <p className="mt-4 rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm font-bold">
            Date limite de dépôt : {depositDeadline}
          </p>
          <p className="mt-4 text-sm leading-6">{parcel.conditions}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--app-text-muted)]">
            <span>Transporteur : {parcel.ownerName} · {parcel.contact}</span>
            {parcel.businessId ? <VerifiedBadge size="sm" label="Entreprise" /> : null}
          </div>
          <div className="mt-5">
            <ContactButton
              ownerId={parcel.ownerId}
              relatedEntity={parcel}
              relatedId={parcel.id}
              relatedPath={`/parcels/${parcel.id}`}
              relatedTitle={`${parcel.origin} vers ${parcel.destination}`}
              relatedType="parcel"
            />
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Réservation</h2>
          {user.id === parcel.ownerId ? (
            <div className="mt-5 grid gap-3">
              {requests.length ? (
                requests.map((request) => {
                  const meta = statusMeta(request.status)
                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl bg-[var(--app-surface-muted)] p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <strong>{request.requesterName}</strong>
                          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                            {request.kg} kg demandés
                          </p>
                        </div>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      {request.status === 'submitted' ? (
                        <div className="mt-3 flex gap-2">
                          <Button onClick={() => handleRequestStatus(request, 'approved')}>
                            Accepter
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRequestStatus(request, 'rejected')}
                          >
                            Refuser
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-[var(--app-text-muted)]">Aucune demande reçue.</p>
              )}
            </div>
          ) : ownRequest ? (
            <Alert
              variant={
                ownRequest.status === 'approved'
                  ? 'success'
                  : ownRequest.status === 'rejected'
                    ? 'error'
                    : 'info'
              }
              title={statusMeta(ownRequest.status).label}
            >
              Votre demande de {ownRequest.kg} kg est suivie automatiquement. Vous recevrez une
              notification à chaque action du transporteur.
            </Alert>
          ) : canReserve ? (
            <div className="mt-5 grid gap-4">
              <Input
                id="reserve-kg"
                label="Poids en kg"
                type="number"
                min="1"
                max={parcel.remainingKg}
                value={kg}
                onChange={(event) => setKg(Number(event.target.value))}
                error={kgError}
              />
              <Alert variant="info">
                Total estimé : {formatMoney(kg * parcel.pricePerKg, parcel.currency)}
              </Alert>
              <Button onClick={handleSendRequest} disabled={Boolean(kgError)}>
                Envoyer la demande
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Ce voyage est complet.</p>
          )}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations du transport">
          <DetailFacts
            items={[
              { label: 'Origine', value: parcel.origin },
              { label: 'Destination', value: parcel.destination },
              { label: 'Date limite de dépôt', value: depositDeadline },
              { label: 'Capacité initiale', value: `${parcel.capacityKg} kg` },
              {
                label: 'Tarif',
                value: `${formatMoney(parcel.pricePerKg, parcel.currency)} / kg`,
              },
              { label: 'Profil', value: parcel.businessId ? 'Entreprise' : 'Particulier' },
              { label: 'Statut', value: statusMeta(parcel.status).label },
              { label: 'Transporteur', value: parcel.ownerName },
            ]}
          />
          {canSeeProof ? (
            <div className="mt-5 grid gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-black">
                  <FiShield className="text-brand-700" /> Preuve de voyage
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                    (visible uniquement par vous et l'admin)
                  </span>
                </p>
                <Badge tone={proofMeta.tone}>{proofMeta.label}</Badge>
              </div>
              {parcel.travelProofUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {parcel.travelProofName || 'Justificatif de voyage'}
                    </p>
                    {parcel.travelProofSize ? (
                      <p className="text-xs text-[var(--app-text-muted)]">
                        {Math.ceil(parcel.travelProofSize / 1024)} Ko
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={parcel.travelProofUrl}
                    download={parcel.travelProofName || true}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
                  >
                    Télécharger <FiDownload className="text-xs" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[var(--app-text-muted)]">Aucun justificatif fourni.</p>
              )}
              {isAdmin && parcel.proofStatus !== 'verified' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      dispatch(updateParcelProofStatus({ id: parcel.id, status: 'verified' }))
                    }
                  >
                    Valider la preuve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      dispatch(updateParcelProofStatus({ id: parcel.id, status: 'rejected' }))
                    }
                  >
                    Rejeter
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DetailSection>
        <TrustPanel
          title="Transport sécurisé"
          items={[
            'Les preuves de voyage restent privées et réservées à l\'administration.',
            'Les objets transportés doivent être déclarés.',
            'La réservation est confirmée par le transporteur.',
          ]}
        />
      </div>
    </div>
  )
}
