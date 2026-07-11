import { FiAlertTriangle, FiShield } from 'react-icons/fi'
import { Alert } from '../../../components/ui/Alert'
import { TRANSFER_STATUS } from '../transferConfig'
import { isClaimOnlyPhase } from '../transferActionUtils'
import { formatDate } from '../transferUtils'

export function TransferDetailStatusSection({
  actionView,
  canDeclare,
  countdown,
  transfer,
}) {
  const claimOnly = isClaimOnlyPhase(transfer)

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[var(--radius-card-lg)] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start dark:border-amber-900/40 dark:bg-amber-950/20">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <FiShield />
        </span>
        <div className="grid gap-1 text-sm text-amber-900 dark:text-amber-200">
          <strong className="flex items-center gap-1.5 font-black">
            <FiAlertTriangle className="text-xs" /> Payez en toute sécurité
          </strong>
          <p className="text-xs leading-5 text-amber-800/90 dark:text-amber-300/80">
            Ne payez jamais en dehors de MOXT, conservez toutes vos preuves de paiement et vérifiez
            les coordonnées du partenaire avant toute transaction.
          </p>
        </div>
      </div>

      {claimOnly ? (
        <Alert variant="info" title="Réclamation uniquement">
          La réception a été déclarée et l’entreprise a confirmé le virement avec preuve. Seule une
          réclamation est possible désormais.
        </Alert>
      ) : null}

      {actionView === 'client' && canDeclare ? (
        <Alert variant="info" title="Paiement attendu">
          Effectuez le paiement avant le {formatDate(transfer.paymentDeadlineAt)}. Temps restant :{' '}
          <strong>{countdown.label}</strong>.
        </Alert>
      ) : null}

      {actionView === 'business' && transfer.status === TRANSFER_STATUS.DECLARED ? (
        <Alert variant="info" title="Déclaration reçue">
          Une déclaration de paiement a été enregistrée. Vérifiez votre compte puis validez la
          réception.
        </Alert>
      ) : null}
    </>
  )
}
