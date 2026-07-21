import { useState } from 'react'
import { FiRepeat, FiUpload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { FileNameText } from '../../components/ui/FileNameText'
import { ImageLightbox } from '../../components/ui/ImageLightbox'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'
import { addToast } from '../../features/ui/uiSlice'
import { TransferRecipientAccountCard } from '../../features/transfers/TransferRecipientAccountCard'
import { moderateTransfer } from '../../features/transfers/transferSlice'
import { TRANSFER_STATUS } from '../../features/transfers/transferConfig'
import {
  canActorPerformBusinessTransferAction,
  canApplyModerateTransfer,
  isClaimOnlyPhase,
} from '../../features/transfers/transferActionUtils'
import { TransferStatusBadge } from '../../features/transfers/TransferStatusBadge'
import {
  directionInfo,
  formatMoney,
  getTransferPricing,
} from '../../features/transfers/transferUtils'
import { TransferAccountsPanel } from './TransferAccountsPanel'

function collectProofImages(transfer, localProof) {
  const urls = []
  if (localProof?.type?.startsWith('image/') && localProof instanceof File) {
    urls.push(URL.createObjectURL(localProof))
  }
  for (const proof of [transfer.paymentProof, transfer.businessProof]) {
    if (proof?.type?.startsWith('image/') && proof.url) urls.push(proof.url)
  }
  return urls
}

export function TransfersPanel({ business, dispatch, transfers, user }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const [proofs, setProofs] = useState({})
  const [lightbox, setLightbox] = useState(null)
  if (!transfers.length) {
    return (
      <div className="grid gap-5">
        {business.services?.includes('Transfert') ? (
          <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
        ) : null}
        <EmptyState
          icon={FiRepeat}
          title={pt('professional.transfers.emptyTitle')}
          description={pt('professional.transfers.emptyDescription')}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {business.services?.includes('Transfert') ? (
        <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
      ) : null}
      {transfers.map((transfer) => {
        const claimOnly = isClaimOnlyPhase(transfer)
        const canActAsBusiness = canActorPerformBusinessTransferAction(
          transfer,
          user?.id,
          user?.role,
        )
        const awaitingPaymentReception =
          canActAsBusiness && transfer.status === TRANSFER_STATUS.DECLARED
        const awaitingPayout = canActAsBusiness && transfer.status === TRANSFER_STATUS.RECEIVED
        const needsBusinessAction = awaitingPaymentReception || awaitingPayout
        const proof = proofs[transfer.id]
        const pricing = getTransferPricing(transfer)
        const currency =
          transfer.currencyFrom ||
          directionInfo(transfer.direction, transfer.originCountry).from
        const proofImages = collectProofImages(transfer, proof)

        return (
          <Card key={transfer.id} className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                  <FiRepeat />
                </span>
                <div className="min-w-0">
                  <strong className="block">{transfer.id}</strong>
                  <span className="text-sm text-[var(--app-text-muted)]">
                    {pt('professional.transfers.summary', {
                      total: formatMoney(pricing.totalToPay, currency),
                      sent: formatMoney(pricing.amountSent, currency),
                      sender: transfer.sender?.firstName || pt('professional.transfers.client'),
                      recipient:
                        transfer.recipient?.firstName || pt('professional.transfers.recipient'),
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TransferStatusBadge status={transfer.status} />
                {proofImages.length ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setLightbox({
                        images: proofImages,
                        index: 0,
                        alt: transfer.id,
                      })
                    }
                  >
                    {pt('professional.publications.viewProof')}
                  </Button>
                ) : null}
                <Link to={`/transfers/${transfer.id}`} state={{ transferView: 'business' }}>
                  <Button variant="secondary">
                    {claimOnly
                      ? pt('professional.transfers.viewClaim')
                      : needsBusinessAction
                        ? pt('professional.transfers.continue')
                        : pt('professional.transfers.viewTracking')}
                  </Button>
                </Link>
              </div>
            </div>

            <TransferRecipientAccountCard transfer={transfer} compact />

            {!claimOnly && awaitingPaymentReception ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
                <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  {pt('professional.transfers.step1Title')}
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {pt('professional.transfers.step1Body')}
                </p>
                <Button
                  className="mt-3"
                  onClick={() => {
                    if (!canApplyModerateTransfer(transfer, TRANSFER_STATUS.RECEIVED)) {
                      dispatch(
                        addToast({
                          title: pt('professional.transfers.toast.impossibleTitle'),
                          message: pt('professional.transfers.toast.receptionAlready'),
                          tone: 'error',
                        }),
                      )
                      return
                    }
                    dispatch(
                      moderateTransfer({
                        id: transfer.id,
                        status: TRANSFER_STATUS.RECEIVED,
                        actorId: user.id,
                        actorRole: user.role,
                      }),
                    )
                    dispatch(
                      addToast({
                        title: pt('professional.transfers.toast.receptionConfirmedTitle'),
                        message: pt('professional.transfers.toast.receptionConfirmedBody'),
                        tone: 'success',
                      }),
                    )
                  }}
                >
                  {pt('professional.transfers.confirmReception')}
                </Button>
              </div>
            ) : null}

            {!claimOnly && awaitingPayout ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
                <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  {pt('professional.transfers.step2Title')}
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {pt('professional.transfers.step2Body')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex min-h-11 min-w-0 max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm">
                    <FiUpload className="shrink-0" />
                    {proof ? (
                      <FileNameText name={proof.name} className="font-bold" maxLength={28} />
                    ) : (
                      <span className="min-w-0 truncate">{pt('professional.transfers.proofLabel')}</span>
                    )}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) =>
                        setProofs((current) => ({
                          ...current,
                          [transfer.id]: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                  {proof?.type?.startsWith('image/') ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setLightbox({
                          images: [URL.createObjectURL(proof)],
                          index: 0,
                          alt: proof.name,
                        })
                      }
                    >
                      {pt('professional.publications.viewImages')}
                    </Button>
                  ) : null}
                  <Button
                    disabled={!proof}
                    onClick={() => {
                      const proofPayload = proof
                        ? {
                            name: proof.name,
                            size: proof.size,
                            type: proof.type,
                            uploadedAt: new Date().toISOString(),
                          }
                        : null
                      if (!canApplyModerateTransfer(transfer, TRANSFER_STATUS.PAID_OUT, proofPayload)) {
                        dispatch(
                          addToast({
                            title: pt('professional.transfers.toast.impossibleTitle'),
                            message: pt('professional.transfers.toast.proofRequired'),
                            tone: 'error',
                          }),
                        )
                        return
                      }
                      dispatch(
                        moderateTransfer({
                          id: transfer.id,
                          status: TRANSFER_STATUS.PAID_OUT,
                          actorId: user.id,
                          actorRole: user.role,
                          proof: proofPayload,
                        }),
                      )
                      dispatch(
                        addToast({
                          title: pt('professional.transfers.toast.confirmedTitle'),
                          message: pt('professional.transfers.toast.confirmedBody'),
                          tone: 'success',
                        }),
                      )
                    }}
                  >
                    {pt('professional.transfers.confirmTransfer')}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )
      })}
      <ImageLightbox
        open={Boolean(lightbox)}
        images={lightbox?.images || []}
        index={lightbox?.index || 0}
        alt={lightbox?.alt || ''}
        onClose={() => setLightbox(null)}
        onIndexChange={(updater) =>
          setLightbox((current) =>
            current
              ? {
                  ...current,
                  index: typeof updater === 'function' ? updater(current.index) : updater,
                }
              : current,
          )
        }
      />
    </div>
  )
}
