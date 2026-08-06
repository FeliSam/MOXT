import { Link } from 'react-router-dom'
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { LinkifiedText } from '../../../components/ui/LinkifiedText'
import { useLanguage } from '../../../contexts/useLanguage'
import { ContactButton } from '../../communications/ContactButton'
import { TransferContactMenu } from './TransferContactMenu'
import { TransferClientNote } from '../TransferClientNote'
import { TransferRecipientAccountCard } from '../TransferRecipientAccountCard'
import { TransferStatusBadge } from '../TransferStatusBadge'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatDate } from '../transferUtils'
import { TransferProgressStepper } from './TransferDetailParts'
import { TransferProofsSection } from './TransferProofsSection'
import { getTransferWorkflowForView } from './transferWorkflowUtils'
import { UploadProgress } from '../../../components/ui/UploadProgress'
import { confirmAction } from '../../../contexts/confirmBridge'
import { shortenFileName } from '../../../services/uploadProgress'
import { adminText } from '../../admin/adminI18n'

export function TransferWorkflowPanel({
  access,
  actionView,
  businessProof,
  canCancel,
  contactOwnerId,
  contactTitle,
  isAdminViewer = false,
  countdown,
  acceptanceCountdown,
  onAcceptRequest,
  onDeclineRequest,
  onReassignClick,
  onBusinessProofSelected,
  onCancel,
  onCompleteBusinessStep,
  onDeclarePayment,
  onProofSelected,
  proof,
  transfer,
}) {
  const { t } = useLanguage()
  const workflow = getTransferWorkflowForView(transfer, actionView, access)
  const { currentAction, waitingMessageKey } = workflow
  const actionTitle = currentAction?.titleKey ? t(currentAction.titleKey) : currentAction?.title
  const actionDescription = currentAction?.descriptionKey
    ? t(currentAction.descriptionKey)
    : currentAction?.description
  const clientNote = transfer.noteToExchanger

  function ask(label, action) {
    confirmAction({
      title: adminText(t, 'admin.confirm.actionTitle'),
      description: adminText(t, 'admin.confirm.actionBody', { action: label }),
      onConfirm: action,
    })
  }

  return (
    <Card className="grid min-w-0 gap-0 overflow-hidden p-0">
      <div className="grid min-w-0 gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
              {t('transfers.workflow.journeyTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t('transfers.workflow.stepsValidated', {
                completed: workflow.completedCount,
                total: workflow.steps.length,
              })}
            </p>
          </div>
          <TransferStatusBadge status={transfer.status} />
        </div>
        <div className="min-w-0 overflow-x-auto">
          <TransferProgressStepper steps={workflow.steps} activeIndex={workflow.activeIndex} />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 px-4 py-5 sm:px-5">
        {currentAction?.type === 'claim' ? (
          <ActionZone
            description={t('transfers.workflow.claimOnlyDescription')}
            title={t('transfers.workflow.claimOnlyTitle')}
          />
        ) : null}

        {currentAction?.type === 'wait_acceptance' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            <div className="rounded-xl bg-[var(--app-surface)] px-4 py-3 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
                {t('transfers.acceptance.countdownLabel')}
              </p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums text-brand-700 dark:text-brand-300">
                {acceptanceCountdown?.label || '--:--'}
              </p>
              <p className="mt-2 break-words text-sm text-[var(--app-text-muted)] [overflow-wrap:anywhere]">
                {t('transfers.acceptance.waitingHint', {
                  name: transfer.exchanger?.name || t('transfers.acceptance.exchangerFallback'),
                })}
              </p>
            </div>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'resolve_acceptance' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            <div className="flex flex-wrap gap-2">
              <Button icon={FiCheckCircle} onClick={onReassignClick}>
                {t('transfers.acceptance.chooseAnother')}
              </Button>
              {canCancel ? (
                <Button variant="danger" icon={FiXCircle} onClick={onCancel}>
                  {t('transfers.workflow.cancelTransfer')}
                </Button>
              ) : null}
            </div>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'accept_request' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            <TransferClientNote note={clientNote} />
            {acceptanceCountdown?.label ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('transfers.acceptance.businessCountdown', {
                  countdown: acceptanceCountdown.label,
                })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                icon={FiCheckCircle}
                onClick={() => ask(t('transfers.acceptance.accept'), onAcceptRequest)}
              >
                {t('transfers.acceptance.accept')}
              </Button>
              <Button
                variant="danger"
                icon={FiXCircle}
                onClick={() => ask(t('transfers.acceptance.decline'), onDeclineRequest)}
              >
                {t('transfers.acceptance.decline')}
              </Button>
            </div>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'confirm_payment_reception' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            <TransferClientNote note={clientNote} />
            <Button
              icon={FiCheckCircle}
              onClick={() =>
                ask(t('transfers.workflow.confirmPaymentReception'), () =>
                  onCompleteBusinessStep(TRANSFER_STATUS.RECEIVED),
                )
              }
            >
              {t('transfers.workflow.confirmPaymentReception')}
            </Button>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'confirm_payout' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            <TransferClientNote note={clientNote} />
            <TransferRecipientAccountCard transfer={transfer} />
            <label className="grid cursor-pointer gap-2 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <span className="flex items-center gap-2 text-sm font-bold">
                <FiUpload className="text-brand-700 dark:text-brand-300" />
                {t('transfers.workflow.transferProofRequired')}
              </span>
              {businessProof?.file || businessProof?.name ? (
                <ProofPreview proof={businessProof} />
              ) : (
                <span className="text-xs text-[var(--app-text-muted)]">
                  {t('transfers.workflow.imageOrPdf')}
                </span>
              )}
              <input
                className="sr-only"
                type="file"
                accept="image/*,.pdf"
                onChange={onBusinessProofSelected}
              />
            </label>
            <Button
              disabled={
                (!businessProof?.file && !businessProof?.name && !transfer.businessProof) ||
                businessProof?.uploading
              }
              loading={businessProof?.uploading}
              icon={FiCheckCircle}
              onClick={() =>
                ask(t('transfers.workflow.confirmTransfer'), () =>
                  onCompleteBusinessStep(TRANSFER_STATUS.PAID_OUT),
                )
              }
            >
              {t('transfers.workflow.confirmTransfer')}
            </Button>
          </ActionZone>
        ) : null}

        {currentAction?.type === 'declare_payment' ? (
          <ActionZone
            description={
              countdown?.label
                ? t('transfers.workflow.declarePaymentWithCountdown', {
                    description: actionDescription,
                    countdown: countdown.label,
                  })
                : actionDescription
            }
            title={actionTitle}
          >
            <label className="grid min-w-0 cursor-pointer gap-2 overflow-hidden rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <span className="flex items-center gap-2 text-sm font-bold">
                <FiUpload className="shrink-0 text-brand-700 dark:text-brand-300" />
                {t('transfers.workflow.paymentProof')}
              </span>
              {proof ? (
                <ProofPreview proof={proof} />
              ) : (
                <span className="text-xs text-[var(--app-text-muted)]">
                  {t('transfers.workflow.imageOrPdf')}
                </span>
              )}
              <input className="sr-only" type="file" accept="image/*,.pdf" onChange={onProofSelected} />
            </label>
            <Button
              disabled={!proof || proof.uploading}
              loading={proof?.uploading}
              icon={FiCheckCircle}
              onClick={() => ask(t('transfers.workflow.declarePayment'), onDeclarePayment)}
            >
              {t('transfers.workflow.declarePayment')}
            </Button>
            {transfer.paymentDeadlineAt ? (
              <p className="text-xs text-[var(--app-text-muted)]">
                {t('transfers.workflow.deadline', { date: formatDate(transfer.paymentDeadlineAt) })}
              </p>
            ) : null}
          </ActionZone>
        ) : null}

        {currentAction?.type === 'declare_reception' ? (
          <ActionZone description={actionDescription} title={actionTitle}>
            {transfer.businessProof ? (
              <CompactProof
                label={t('transfers.workflow.businessProof')}
                proof={transfer.businessProof}
              />
            ) : null}
            <Link to={`/transfers/${transfer.id}/receive`} state={{ transferView: 'client' }}>
              <Button className="w-full sm:w-auto" icon={FiCheckCircle}>
                {t('transfers.workflow.declareReception')}
              </Button>
            </Link>
          </ActionZone>
        ) : null}

        {!currentAction && waitingMessageKey ? (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--app-surface-muted)] p-4">
            <FiClock className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
            <div>
              <p className="text-sm font-bold">{t('transfers.workflow.waitingTitle')}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                {t(waitingMessageKey)}
              </p>
            </div>
          </div>
        ) : null}

        {canCancel && currentAction?.type !== 'resolve_acceptance' ? (
          <Button className="justify-self-start" variant="danger" icon={FiXCircle} onClick={onCancel}>
            {t('transfers.workflow.cancelTransfer')}
          </Button>
        ) : null}

        <TransferProofsSection className="border-t border-[var(--app-border)] pt-4" compact transfer={transfer} />

        {isAdminViewer ? (
          <div className="flex justify-end border-t border-[var(--app-border)] pt-4">
            <TransferContactMenu transfer={transfer} variant="secondary">
              {t('transfers.workflow.contactChat')}
            </TransferContactMenu>
          </div>
        ) : contactOwnerId ? (
          <div className="flex justify-end border-t border-[var(--app-border)] pt-4">
            <ContactButton
              ownerId={contactOwnerId}
              relatedEntity={transfer}
              relatedId={transfer.id}
              relatedPath={`/transfers/${transfer.id}`}
              relatedTitle={t('transfers.detail.relatedTitle', {
                id: transfer.id,
                contact: contactTitle || '',
              })}
              relatedType="transfer"
              variant="secondary"
            >
              {t('transfers.workflow.contactChat')}
            </ContactButton>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function ActionZone({ children, description, title }) {
  const { t } = useLanguage()
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border-2 border-brand-300 bg-brand-50/30 p-4 dark:border-brand-700 dark:bg-brand-950/20">
      <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
        {t('transfers.workflow.actionRequired')}
      </p>
      <h3 className="mt-1 break-words font-black [overflow-wrap:anywhere]">{title}</h3>
      <LinkifiedText
        as="p"
        text={description}
        preserveWhitespace="pre-line"
        className="mt-2 text-sm leading-6 text-[var(--app-text-muted)] [overflow-wrap:anywhere]"
      />
      {children ? <div className="mt-4 grid min-w-0 gap-3">{children}</div> : null}
    </div>
  )
}

function CompactProof({ label, proof }) {
  if (!proof?.name) return null
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold">
      <FiFileText className="shrink-0 text-brand-700 dark:text-brand-300" />
        <span className="min-w-0 flex-1 truncate" title={`${label}: ${proof.name}`}>
          {label}: {shortenFileName(proof.name, 28)}
        </span>
    </div>
  )
}

function ProofPreview({ proof }) {
  const { t } = useLanguage()
  const file = proof.file || proof
  const name = file?.name || proof.name
  const type = file?.type || proof.type
  const previewUrl = proof.url || (file instanceof File ? URL.createObjectURL(file) : null)
  const uploading = Boolean(proof.uploading)

  return (
    <div className="grid min-w-0 gap-2 overflow-hidden rounded-lg bg-[var(--app-surface)] p-2">
      <div className="flex min-w-0 items-center gap-3">
        {type?.startsWith('image/') && previewUrl ? (
          <img src={previewUrl} alt={name} className="size-10 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            <FiFileText className="text-sm" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold" title={name}>
          {shortenFileName(name, 28)}
        </span>
        {uploading ? null : <FiCheck className="shrink-0 text-emerald-600" />}
      </div>
      {uploading ? (
        <UploadProgress
          compact
          progress={{
            active: true,
            phase: proof.phase || 'uploading',
            percent: proof.progress ?? 35,
            fileName: name,
          }}
        />
      ) : null}
      {!uploading && !proof.url && !previewUrl ? (
        <span className="text-[11px] text-[var(--app-text-muted)]">
          {t('transfers.workflow.uploading')}
        </span>
      ) : null}
    </div>
  )
}
