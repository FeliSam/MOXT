import { FiAlertTriangle, FiClock, FiShield } from 'react-icons/fi'
import { Alert } from '../../../components/ui/Alert'
import { Card } from '../../../components/ui/Card'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatDate } from '../transferUtils'
import { TransferProgressStepper } from './TransferDetailParts'

export function TransferDetailStatusSection({ canDeclare, countdown, transfer }) {
  return (
    <>
      {![TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(transfer.status) ? (
        <Card>
          <h2 className="flex items-center gap-2 font-black">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <FiClock className="text-sm" />
            </span>
            Progression
          </h2>
          <TransferProgressStepper status={transfer.status} />
        </Card>
      ) : null}

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

      {canDeclare ? (
        <Alert variant="info" title="Paiement attendu">
          Effectuez le paiement avant le {formatDate(transfer.paymentDeadlineAt)}, puis utilisez le
          bouton de déclaration. Temps restant : <strong>{countdown.label}</strong>. Vérifiez les
          coordonnées avant toute opération.
        </Alert>
      ) : null}
    </>
  )
}
