import { Link } from 'react-router-dom'
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiFlag,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { TransferStatusBadge } from '../TransferStatusBadge'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatDate } from '../transferUtils'
import { TransferProgressStepper } from './TransferDetailParts'
import { TransferProofsSection } from './TransferProofsSection'
import { getTransferWorkflowForView } from './transferWorkflowUtils'

export function TransferWorkflowPanel({
  access,
  actionView,
  businessProof,
  canCancel,
  countdown,
  onBusinessProofSelected,
  onCancel,
  onCompleteBusinessStep,
  onDeclarePayment,
  onOpenClaim,
  onProofSelected,
  proof,
  transfer,
}) {
  const workflow = getTransferWorkflowForView(transfer, actionView, access)
  const { currentAction, waitingMessage } = workflow

  return (
    <Card className="grid gap-0 overflow-hidden p-0">
      <div className="grid gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
              Parcours du transfert
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {workflow.completedCount}/{workflow.steps.length} étapes validées
            </p>
          </div>
          <TransferStatusBadge status={transfer.status} />
        </div>
        <TransferProgressStepper steps={workflow.steps} activeIndex={workflow.activeIndex} />
      </div>

      <div className="grid gap-4 px-4 py-5 sm:px-5">
        {currentAction?.type === 'claim' ? (
          <ActionZone
            description="Toutes les étapes sont complétées. En cas de problème, ouvrez une réclamation."
            title="Réclamation uniquement"
          >
            <Button variant="secondary" icon={FiFlag} onClick={onOpenClaim}>
              Ouvrir une réclamation
            </Button>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'confirm_payment_reception' ? (
          <ActionZone description={currentAction.description} title={currentAction.title}>
            <Button
              icon={FiCheckCircle}
              onClick={() => onCompleteBusinessStep(TRANSFER_STATUS.RECEIVED)}
            >
              Confirmer la réception du paiement
            </Button>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'confirm_payout' ? (
          <ActionZone description={currentAction.description} title={currentAction.title}>
            <label className="grid cursor-pointer gap-2 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <span className="flex items-center gap-2 text-sm font-bold">
                <FiUpload className="text-brand-700 dark:text-brand-300" />
                Preuve de transfert (obligatoire)
              </span>
              {businessProof?.file || businessProof?.name ? (
                <ProofPreview proof={businessProof} />
              ) : (
                <span className="text-xs text-[var(--app-text-muted)]">Image ou PDF du virement</span>
              )}
              <input
                className="sr-only"
                type="file"
                accept="image/*,.pdf"
                onChange={onBusinessProofSelected}
              />
            </label>
            <Button
              disabled={(!businessProof?.file && !businessProof?.name && !transfer.businessProof) || businessProof?.uploading}
              loading={businessProof?.uploading}
              icon={FiCheckCircle}
              onClick={() => onCompleteBusinessStep(TRANSFER_STATUS.PAID_OUT)}
            >
              Confirmer le transfert
            </Button>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'declare_payment' ? (
          <ActionZone
            description={
              countdown?.label
                ? `${currentAction.description} Temps restant : ${countdown.label}.`
                : currentAction.description
            }
            title={currentAction.title}
          >
            <label className="grid cursor-pointer gap-2 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <span className="flex items-center gap-2 text-sm font-bold">
                <FiUpload className="text-brand-700 dark:text-brand-300" />
                Preuve de paiement
              </span>
              {proof ? (
                <ProofPreview proof={proof} />
              ) : (
                <span className="text-xs text-[var(--app-text-muted)]">Image ou PDF du virement</span>
              )}
              <input className="sr-only" type="file" accept="image/*,.pdf" onChange={onProofSelected} />
            </label>
            <Button
              disabled={!proof || proof.uploading}
              loading={proof?.uploading}
              icon={FiCheckCircle}
              onClick={onDeclarePayment}
            >
              Déclarer le paiement
            </Button>
            {transfer.paymentDeadlineAt ? (
              <p className="text-xs text-[var(--app-text-muted)]">
                Date limite : {formatDate(transfer.paymentDeadlineAt)}
              </p>
            ) : null}
          </ActionZone>
        ) : null}

        {currentAction?.type === 'declare_reception' ? (
          <ActionZone description={currentAction.description} title={currentAction.title}>
            {transfer.businessProof ? (
              <CompactProof label="Preuve entreprise" proof={transfer.businessProof} />
            ) : null}
            <Link to={`/transfers/${transfer.id}/receive`} state={{ transferView: 'client' }}>
              <Button className="w-full sm:w-auto" icon={FiCheckCircle}>
                Déclarer la réception
              </Button>
            </Link>
          </ActionZone>
        ) : null}

        {!currentAction && waitingMessage ? (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--app-surface-muted)] p-4">
            <FiClock className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
            <div>
              <p className="text-sm font-bold">En attente</p>
              <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{waitingMessage}</p>
            </div>
          </div>
        ) : null}

        {canCancel ? (
          <Button className="justify-self-start" variant="danger" icon={FiXCircle} onClick={onCancel}>
            Annuler le transfert
          </Button>
        ) : null}

        <TransferProofsSection className="border-t border-[var(--app-border)] pt-4" compact transfer={transfer} />
      </div>
    </Card>
  )
}

function ActionZone({ children, description, title }) {
  return (
    <div className="rounded-2xl border-2 border-brand-300 bg-brand-50/30 p-4 dark:border-brand-700 dark:bg-brand-950/20">
      <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
        Action requise
      </p>
      <h3 className="mt-1 font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  )
}

function ProofPreview({ proof }) {
  const file = proof.file || proof
  const name = file?.name || proof.name
  const type = file?.type || proof.type
  const previewUrl = proof.url || (file instanceof File ? URL.createObjectURL(file) : null)

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--app-surface)] p-2">
      {type?.startsWith('image/') && previewUrl ? (
        <img src={previewUrl} alt={name} className="size-10 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiFileText className="text-sm" />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{name}</span>
      {proof.uploading ? (
        <span className="text-[11px] text-[var(--app-text-muted)]">Envoi…</span>
      ) : (
        <FiCheck className="shrink-0 text-emerald-600" />
      )}
    </div>
  )
}
