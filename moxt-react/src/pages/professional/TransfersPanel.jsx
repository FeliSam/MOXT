import { useState } from 'react'
import { FiRepeat, FiUpload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { moderateTransfer } from '../../features/transfers/transferSlice'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../../features/transfers/transferConfig'
import { TransferStatusBadge } from '../../features/transfers/TransferStatusBadge'
import { formatMoney } from '../../features/transfers/transferUtils'
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
  const actionLabels = {
    [TRANSFER_STATUS.RECEIVED]: 'Confirmer le paiement',
    [TRANSFER_STATUS.PAID_OUT]: 'Effectuer le transfert',
    [TRANSFER_STATUS.COMPLETED]: 'Valider le paiement',
  }
  return (
    <div className="grid gap-3">
      {business.services?.includes('Transfert') ? (
        <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
      ) : null}
      {transfers.map((transfer) => {
        const nextStatus = TRANSFER_TRANSITIONS[transfer.status]
        const requiresProof = nextStatus === TRANSFER_STATUS.PAID_OUT
        const proof = proofs[transfer.id]
        return (
          <Card
            key={transfer.id}
            className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiRepeat />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block">{transfer.id}</strong>
              <span className="text-sm text-[var(--app-text-muted)]">
                {formatMoney(transfer.totalToPay, transfer.currencyFrom)} ·{' '}
                {transfer.sender.firstName} vers {transfer.recipient.firstName}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <TransferStatusBadge status={transfer.status} />
              <Link to={`/transfers/${transfer.id}`}>
                <Button variant="secondary">Voir le suivi</Button>
              </Link>
              {requiresProof ? (
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-4 text-sm font-bold shadow-sm">
                  <FiUpload /> {proof ? proof.name : 'Preuve de virement'}
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
              ) : null}
              {nextStatus ? (
                <Button
                  onClick={() =>
                    dispatch(
                      moderateTransfer({
                        id: transfer.id,
                        status: nextStatus,
                        proof: proof
                          ? {
                              name: proof.name,
                              size: proof.size,
                              type: proof.type,
                              uploadedAt: new Date().toISOString(),
                            }
                          : null,
                      }),
                    )
                  }
                >
                  {actionLabels[nextStatus]}
                </Button>
              ) : null}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
