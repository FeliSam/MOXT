import { useState } from 'react'
import { FiRepeat, FiUpload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { addToast } from '../../features/ui/uiSlice'
import { moderateTransfer } from '../../features/transfers/transferSlice'
import { TRANSFER_STATUS } from '../../features/transfers/transferConfig'
import {
  canApplyModerateTransfer,
  isClaimOnlyPhase,
  transferNeedsBusinessAction,
} from '../../features/transfers/transferActionUtils'
import { TransferStatusBadge } from '../../features/transfers/TransferStatusBadge'
import {
  directionInfo,
  formatMoney,
  getTransferPricing,
} from '../../features/transfers/transferUtils'
import { TransferAccountsPanel } from './TransferAccountsPanel'

export function TransfersPanel({ business, dispatch, transfers, user }) {
  const [proofs, setProofs] = useState({})
  if (!transfers.length) {
    return (
      <div className="grid gap-5">
        {business.services?.includes('Transfert') ? (
          <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
        ) : null}
        <EmptyState
          icon={FiRepeat}
          title="Aucun transfert reçu"
          description="Les opérations créées avec votre entreprise apparaîtront ici."
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
        const awaitingPaymentReception = transfer.status === TRANSFER_STATUS.DECLARED
        const awaitingPayout = transfer.status === TRANSFER_STATUS.RECEIVED
        const needsBusinessAction = awaitingPaymentReception || awaitingPayout
        const proof = proofs[transfer.id]
        const pricing = getTransferPricing(transfer)
        const currency =
          transfer.currencyFrom ||
          directionInfo(transfer.direction, transfer.originCountry).from

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
                    {formatMoney(pricing.totalToPay, currency)} ·{' '}
                    {formatMoney(pricing.amountSent, currency)} envoyés ·{' '}
                    {transfer.sender?.firstName || 'Client'} vers {transfer.recipient?.firstName || 'Destinataire'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TransferStatusBadge status={transfer.status} />
                <Link to={`/transfers/${transfer.id}`} state={{ transferView: 'business' }}>
                  <Button variant="secondary">
                    {claimOnly ? 'Voir / réclamation' : needsBusinessAction ? 'Continuer' : 'Voir le suivi'}
                  </Button>
                </Link>
              </div>
            </div>

            {!claimOnly && awaitingPaymentReception ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
                <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  Étape 1 — Réception du paiement
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Vérifiez votre compte puis confirmez la réception.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => {
                    if (!canApplyModerateTransfer(transfer, TRANSFER_STATUS.RECEIVED)) {
                      dispatch(
                        addToast({
                          title: 'Action impossible',
                          message:
                            'La réception a déjà été confirmée ou le transfert n’est plus à cette étape.',
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
                      }),
                    )
                    dispatch(
                      addToast({
                        title: 'Réception confirmée',
                        message: 'Ajoutez maintenant la preuve puis confirmez le transfert.',
                        tone: 'success',
                      }),
                    )
                  }}
                >
                  Confirmer la réception du paiement
                </Button>
              </div>
            ) : null}

            {!claimOnly && awaitingPayout ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
                <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  Étape 2 — Confirmer le transfert
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Ajoutez la preuve du virement effectué, puis confirmez le transfert.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm">
                    <FiUpload /> {proof ? proof.name : 'Preuve de transfert'}
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
                            title: 'Action impossible',
                            message: 'Ajoutez une preuve de virement avant de confirmer le transfert.',
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
                          proof: proofPayload,
                        }),
                      )
                      dispatch(
                        addToast({
                          title: 'Transfert confirmé',
                          message: 'Le client peut maintenant déclarer la réception des fonds.',
                          tone: 'success',
                        }),
                      )
                    }}
                  >
                    Confirmer le transfert
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
