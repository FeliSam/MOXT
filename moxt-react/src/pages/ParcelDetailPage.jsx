import { FiArrowRight, FiBox, FiCalendar, FiDownload, FiEdit2, FiMapPin, FiSend, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { DetailFloatingActions } from '../components/ui/DetailFloatingActions'
import { useLanguage } from '../contexts/useLanguage'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { ContactButton } from '../features/communications/ContactButton'
import { openRelatedConversation } from '../features/communications/openRelatedConversation'
import { buildParcelSnapshot } from '../features/communications/relatedSnapshot'
import {
  requestParcelReservation,
  updateParcelProofStatus,
  updateParcelRequestStatus,
} from '../features/parcels/parcelSlice'
import { parcelDetailTrustItemKeys } from '../features/parcels/parcelBrowseConfig'
import {
  parcelProofLabelKey,
  resolveParcelProofStatus,
} from '../features/parcels/parcelProofUtils'
import { Input } from '../components/ui/Input'
import { addToast } from '../features/ui/uiSlice'
import { statusMeta } from '../config/statuses'
import { formatMoney } from '../features/transfers/transferUtils'
import { formatDateTime } from '../utils/formatters'
import { PublisherDetailCard } from '../features/publications/PublisherDetailCard'
import { PublisherPublicationsStrip } from '../features/publications/PublisherPublicationsStrip'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'

export function ParcelDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { parcelId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const parcel = useSelector((state) => state.parcels.items.find((item) => item.id === parcelId))
  const requests = useSelector((state) =>
    state.parcels.requests.filter((item) => item.parcelId === parcelId),
  )
  const [reserveKg, setReserveKg] = useState('')
  const [reserveMessage, setReserveMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const myRequest = requests.find(
    (item) => item.userId === user.id && item.status === 'submitted',
  )
  const publisherProfile = usePublisherDetailProfile(parcel, 'parcel')

  if (!parcel) return <Card>{t('parcels.detail.notFound')}</Card>

  const depositDeadline = parcel.depositDeadline || parcel.departureDate
  const distributionDate = parcel.distributionDate || null
  const isAdmin = ['admin', 'superadmin'].includes(user.role)
  const canSeeProof = isAdmin || user.id === parcel.ownerId
  const proofStatus = resolveParcelProofStatus(parcel)
  const proofMeta =
    proofStatus === 'missing'
      ? { label: t(parcelProofLabelKey('missing')), tone: 'info' }
      : {
          ...statusMeta(proofStatus, t),
          label:
            proofStatus === 'verified'
              ? t(parcelProofLabelKey('verified'))
              : proofStatus === 'pending_review'
                ? t(parcelProofLabelKey('pending_review'))
                : proofStatus === 'rejected'
                  ? t(parcelProofLabelKey('rejected'))
                  : statusMeta(proofStatus, t).label,
        }
  const routeTitle = t('parcels.detail.routeTitle', {
    origin: parcel.origin,
    destination: parcel.destination,
  })

  function handleRequestStatus(request, status) {
    dispatch(updateParcelRequestStatus({ id: request.id, status }))
    dispatch(
      addToast({
        title:
          status === 'approved'
            ? t('parcels.detail.toast.requestAccepted')
            : t('parcels.detail.toast.requestRejected'),
        message: `${request.requesterName} · ${request.kg} kg`,
        tone: status === 'approved' ? 'success' : 'error',
      }),
    )
  }

  async function submitReservation() {
    const kg = Number(reserveKg)
    const message = reserveMessage.trim()
    if (!kg || kg <= 0 || kg > parcel.remainingKg) {
      dispatch(
        addToast({
          title: t('parcels.detail.toast.invalidWeightTitle'),
          message: t('parcels.detail.toast.invalidWeightMessage', {
            max: parcel.remainingKg,
          }),
          tone: 'error',
        }),
      )
      return
    }
    if (message.length < 5) {
      dispatch(
        addToast({
          title: t('parcels.detail.toast.messageRequiredTitle'),
          message: t('parcels.detail.toast.messageRequiredBody'),
          tone: 'error',
        }),
      )
      return
    }
    setSendingRequest(true)
    dispatch(
      requestParcelReservation({
        parcelId: parcel.id,
        userId: user.id,
        requesterName: `${user.firstName} ${user.lastName}`.trim(),
        ownerId: parcel.ownerId,
        businessId: parcel.businessId || null,
        kg,
      }),
    )
    const chatMessage = t('parcels.detail.reserve.chatMessage', { kg, message })
    await openRelatedConversation({
      dispatch,
      navigate,
      user,
      ownerId: parcel.ownerId,
      relatedType: 'parcel',
      relatedId: parcel.id,
      relatedPath: `/parcels/${parcel.id}`,
      relatedEntity: parcel,
      relatedTitle: routeTitle,
      initialMessage: chatMessage,
    })
    setReserveKg('')
    setReserveMessage('')
    setSendingRequest(false)
  }

  const routeDescription = distributionDate
    ? t('parcels.detail.descriptionWithDistribution', {
        departure: parcel.departureDate,
        deposit: depositDeadline,
        distribution: distributionDate,
      })
    : t('parcels.detail.descriptionWithoutDistribution', {
        departure: parcel.departureDate,
        deposit: depositDeadline,
      })
  const publishedLabel = parcel.createdAt
    ? t('parcels.detail.publishedOn', { date: formatDateTime(parcel.createdAt) })
    : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={parcel.id}
        title={routeTitle}
        description={[routeDescription, publishedLabel].filter(Boolean).join(' · ')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Sur mobile/tablette, Contacter + Favoris passent par le bouton "..." flottant. */}
            <FavoriteButton
              relatedId={parcel.id}
              relatedType="parcel"
              title={routeTitle}
              path={`/parcels/${parcel.id}`}
              entity={parcel}
              showLabel={false}
              className="hidden !size-11 shrink-0 xl:inline-flex"
            />
            <ReshareButton sourceType="parcel" sourceId={parcel.id} sourceData={parcel} />
            {user.id === parcel.ownerId ? (
              <Link to={`/parcels/${parcelId}/edit`}>
                <Button variant="secondary" icon={FiEdit2}>
                  {t('parcels.detail.edit')}
                </Button>
              </Link>
            ) : null}
            <BackButton fallback="/parcels" />
          </div>
        }
      />

      {/* Route visuelle origine -> destination */}
      <div className="relative rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <span className="absolute -top-3 right-3 z-10">
          <Badge tone={proofMeta.tone} className="!px-1.5 !py-0.5 !text-[9px]">
            {proofMeta.label}
          </Badge>
        </span>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-faint)]">
              {t('parcels.detail.origin')}
            </p>
            <p className="mt-1 truncate text-lg font-black sm:text-xl">{parcel.origin}</p>
            {parcel.originAirportCode ? (
              <p className="text-xs font-bold text-[var(--app-text-muted)]">{parcel.originAirportCode}</p>
            ) : null}
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
            <FiArrowRight />
          </span>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-faint)]">
              {t('parcels.detail.destination')}
            </p>
            <p className="mt-1 truncate text-lg font-black sm:text-xl">{parcel.destination}</p>
            {parcel.destinationAirportCode ? (
              <p className="text-xs font-bold text-[var(--app-text-muted)]">{parcel.destinationAirportCode}</p>
            ) : null}
          </div>
        </div>
      </div>

      <DetailMetrics
        items={[
          {
            icon: FiBox,
            label: t('parcels.detail.metrics.remainingCapacity'),
            value: `${parcel.remainingKg} kg`,
          },
          { icon: FiCalendar, label: t('parcels.detail.metrics.departure'), value: parcel.departureDate },
          {
            icon: FiCalendar,
            label: t('parcels.detail.metrics.depositDeadline'),
            value: depositDeadline,
          },
          {
            icon: FiDownload,
            label: t('parcels.detail.metrics.distribution'),
            value: distributionDate || t('parcels.detail.toConfirm'),
          },
          {
            icon: FiMapPin,
            label: t('parcels.detail.metrics.route'),
            value: `${parcel.origin} → ${parcel.destination}`,
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <FiBox className="text-3xl text-brand-700" />
          <h2 className="mt-4 text-xl font-black">
            {t('parcels.detail.kgAvailable', { kg: parcel.remainingKg })}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t('parcels.detail.perKilogram', {
              price: formatMoney(parcel.pricePerKg, parcel.currency),
            })}
          </p>
          <p className="mt-4 rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm font-bold">
            {t('parcels.detail.depositDeadlineLabel', { date: depositDeadline })}
          </p>
          {distributionDate ? (
            <p className="mt-2 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {t('parcels.detail.pickupFromDate', { date: distributionDate })}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-6">{parcel.conditions}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--app-text-muted)]">
            <span>
              {t('parcels.detail.carrier', {
                name: parcel.ownerName,
                contact: parcel.contact,
              })}
            </span>
            {parcel.businessId ? (
              <VerifiedBadge size="sm" label={t('parcels.detail.business')} />
            ) : null}
          </div>
          <div className="mt-5 hidden xl:block">
            <ContactButton
              ownerId={parcel.ownerId}
              relatedEntity={parcel}
              relatedId={parcel.id}
              relatedPath={`/parcels/${parcel.id}`}
              relatedTitle={routeTitle}
              relatedType="parcel"
            />
          </div>
        </Card>
        {user.id !== parcel.ownerId && parcel.status === 'active' && parcel.remainingKg > 0 ? (
          <Card>
            <h2 className="font-black">{t('parcels.detail.reserve.title')}</h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              {t('parcels.detail.reserve.description')}
            </p>
            {myRequest ? (
              <p className="mt-4 rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm font-bold">
                {t('parcels.detail.reserve.pending', { kg: myRequest.kg })}
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                <Input
                  id="parcel-reserve-kg"
                  label={t('parcels.detail.reserve.weightLabel')}
                  type="number"
                  min="1"
                  max={parcel.remainingKg}
                  value={reserveKg}
                  onChange={(event) => setReserveKg(event.target.value)}
                />
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold">
                    {t('parcels.detail.reserve.messageLabel')}
                  </span>
                  <textarea
                    className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
                    placeholder={t('parcels.detail.reserve.messagePlaceholder')}
                    value={reserveMessage}
                    onChange={(event) => setReserveMessage(event.target.value)}
                  />
                </label>
                <Button icon={FiSend} disabled={sendingRequest} onClick={submitReservation}>
                  {sendingRequest
                    ? t('parcels.detail.reserve.sending')
                    : t('parcels.detail.reserve.submit')}
                </Button>
              </div>
            )}
          </Card>
        ) : null}
        {user.id === parcel.ownerId ? (
          <Card>
            <h2 className="font-black">{t('parcels.detail.requests.title')}</h2>
            <div className="mt-5 grid gap-3">
              {requests.length ? (
                requests.map((request) => {
                  const meta = statusMeta(request.status, t)
                  const canMessageRequester =
                    request.status === 'approved' && request.userId && request.userId !== user.id
                  const reservationSnapshot = buildParcelSnapshot(parcel, `/parcels/${parcel.id}`, {
                    reservedKg: request.kg,
                    requesterName: request.requesterName,
                    t,
                  })
                  const reservationMessage = [
                    t('parcels.detail.message.greeting', {
                      name: request.requesterName || '',
                    }).trim(),
                    t('parcels.detail.message.accepted', {
                      kg: request.kg,
                      origin: parcel.origin,
                      destination: parcel.destination,
                    }),
                    t('parcels.detail.message.followUp'),
                  ].join('\n')
                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl bg-[var(--app-surface-muted)] p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          {canMessageRequester ? (
                            <ContactButton
                              asLink
                              ownerId={request.userId}
                              relatedEntity={parcel}
                              relatedId={parcel.id}
                              relatedPath={`/parcels/${parcel.id}`}
                              relatedTitle={routeTitle}
                              relatedType="parcel"
                              relatedSnapshot={reservationSnapshot}
                              contactProfile={{
                                firstName: String(
                                  request.requesterName || t('parcels.detail.requests.clientFallback'),
                                )
                                  .trim()
                                  .split(/\s+/)[0],
                                lastName: String(request.requesterName || '')
                                  .trim()
                                  .split(/\s+/)
                                  .slice(1)
                                  .join(' '),
                              }}
                              initialMessage={reservationMessage}
                            >
                              <EntityVerifiedName
                                name={request.requesterName}
                                userId={request.userId}
                              />
                            </ContactButton>
                          ) : (
                            <EntityVerifiedName
                              as="strong"
                              name={request.requesterName}
                              userId={request.userId}
                            />
                          )}
                          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                            {t('parcels.detail.requests.kgRequested', { kg: request.kg })}
                          </p>
                        </div>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      {request.status === 'submitted' ? (
                        <div className="mt-3 flex gap-2">
                          <Button onClick={() => handleRequestStatus(request, 'approved')}>
                            {t('parcels.detail.requests.accept')}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRequestStatus(request, 'rejected')}
                          >
                            {t('parcels.detail.requests.reject')}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-[var(--app-text-muted)]">
                  {t('parcels.detail.requests.empty')}
                </p>
              )}
            </div>
          </Card>
        ) : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title={t('parcels.detail.info.title')}>
          <DetailFacts
            items={[
              { label: t('parcels.detail.info.origin'), value: parcel.origin },
              { label: t('parcels.detail.info.destination'), value: parcel.destination },
              { label: t('parcels.detail.info.depositDeadline'), value: depositDeadline },
              {
                label: t('parcels.detail.info.distributionDate'),
                value: distributionDate || t('parcels.detail.toConfirm'),
              },
              {
                label: t('parcels.detail.info.initialCapacity'),
                value: `${parcel.capacityKg} kg`,
              },
              {
                label: t('parcels.detail.info.rate'),
                value: `${formatMoney(parcel.pricePerKg, parcel.currency)} / kg`,
              },
              {
                label: t('parcels.detail.info.profile'),
                value: parcel.businessId
                  ? t('parcels.detail.profile.business')
                  : t('parcels.detail.profile.individual'),
              },
              { label: t('parcels.detail.info.status'), value: statusMeta(parcel.status, t).label },
              {
                label: t('parcels.detail.info.carrier'),
                value: (
                  <EntityVerifiedName
                    name={parcel.ownerName}
                    userId={parcel.ownerId}
                    businessId={parcel.businessId}
                  />
                ),
              },
            ]}
          />
          {canSeeProof ? (
            <div className="mt-5 grid gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-black">
                  <FiShield className="text-brand-700" /> {t('parcels.detail.proof.title')}
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                    {t('parcels.detail.proof.visibilityNote')}
                  </span>
                </p>
                <Badge tone={proofMeta.tone}>{proofMeta.label}</Badge>
              </div>
              {parcel.travelProofUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {parcel.travelProofName || t('parcels.detail.proof.defaultName')}
                    </p>
                    {parcel.travelProofSize ? (
                      <p className="text-xs text-[var(--app-text-muted)]">
                        {t('parcels.detail.proof.sizeKb', {
                          size: Math.ceil(parcel.travelProofSize / 1024),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={parcel.travelProofUrl}
                    download={parcel.travelProofName || true}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
                  >
                    {t('parcels.detail.proof.download')} <FiDownload className="text-xs" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[var(--app-text-muted)]">
                  {t(parcelProofLabelKey(proofStatus))}
                </p>
              )}
              {isAdmin && proofStatus !== 'verified' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      dispatch(updateParcelProofStatus({ id: parcel.id, status: 'verified' }))
                    }
                  >
                    {t('parcels.detail.proof.validate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      dispatch(updateParcelProofStatus({ id: parcel.id, status: 'rejected' }))
                    }
                  >
                    {t('parcels.detail.proof.reject')}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DetailSection>
        <div className="grid gap-5">
          {publisherProfile ? (
            <>
              <PublisherDetailCard {...publisherProfile} />
              <PublisherPublicationsStrip
                currentId={parcel.id}
                ownerId={publisherProfile.ownerId}
                publications={publisherProfile.publications}
                allPath={publisherProfile.publicationsPath}
              />
            </>
          ) : null}
          <TrustPanel
            title={t('parcels.detail.trust.title')}
            items={parcelDetailTrustItemKeys.map((key) => t(key))}
          />
        </div>
      </div>
      <DetailFloatingActions
        isOwner={user.id === parcel.ownerId}
        ownerId={parcel.ownerId}
        entity={parcel}
        relatedId={parcel.id}
        relatedPath={`/parcels/${parcel.id}`}
        relatedType="parcel"
        title={routeTitle}
      />
    </div>
  )
}
