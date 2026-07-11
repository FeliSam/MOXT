import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiFlag,
  FiLock,
  FiUpload,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatDate } from '../transferUtils'
import { hasBusinessConfirmedReception, hasBusinessPayoutWithProof } from '../transferActionUtils'
import { getVisibleRoleLanes } from './transferDetailRoleLogic'

export function TransferDetailRoleActions({
  access,
  actionView,
  businessProof,
  canCancel,
  canConfirmPaymentReception,
  canConfirmPayout,
  canDeclare,
  canDeclareReception,
  canOpenClaim,
  onBusinessProofSelected,
  onCancel,
  onCompleteBusinessStep,
  onDeclarePayment,
  onOpenClaim,
  onProofSelected,
  proof,
  transfer,
}) {
  const { lanes, showBusiness, showClient } = getVisibleRoleLanes(transfer, access, actionView)

  if (!showClient && !showBusiness) return null

  const gridClass =
    showClient && showBusiness ? 'grid gap-5 xl:grid-cols-2' : 'grid gap-5 max-w-3xl'

  return (
    <div className={gridClass}>
      {showClient ? (
        <RoleLaneCard
          lane={lanes.client}
          transfer={transfer}
          proof={proof}
          canDeclare={canDeclare}
          canCancel={canCancel}
          canDeclareReception={canDeclareReception}
          canOpenClaim={canOpenClaim}
          onProofSelected={onProofSelected}
          onDeclarePayment={onDeclarePayment}
          onCancel={onCancel}
          onOpenClaim={onOpenClaim}
        />
      ) : null}
      {showBusiness ? (
        <RoleLaneCard
          lane={lanes.business}
          transfer={transfer}
          businessProof={businessProof}
          canConfirmPaymentReception={canConfirmPaymentReception}
          canConfirmPayout={canConfirmPayout}
          canOpenClaim={canOpenClaim}
          onBusinessProofSelected={onBusinessProofSelected}
          onCompleteBusinessStep={onCompleteBusinessStep}
          onOpenClaim={onOpenClaim}
        />
      ) : null}
    </div>
  )
}

function RoleLaneCard({
  lane,
  transfer,
  proof,
  businessProof,
  canDeclare,
  canCancel,
  canDeclareReception,
  canConfirmPaymentReception,
  canConfirmPayout,
  canOpenClaim,
  onProofSelected,
  onDeclarePayment,
  onCancel,
  onBusinessProofSelected,
  onCompleteBusinessStep,
  onOpenClaim,
}) {
  const isClient = lane.id === 'client'
  const Icon = isClient ? FiUser : FiBriefcase
  const accent = lane.isActive && !canOpenClaim

  return (
    <Card
      className={`grid gap-4 transition-all ${
        accent
          ? 'border-2 border-brand-400 bg-brand-50/50 shadow-lg shadow-brand-100/60 dark:border-brand-600 dark:bg-brand-950/30 dark:shadow-brand-950/40'
          : 'border border-[var(--app-border)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
              accent
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
            }`}
          >
            <Icon />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
              {lane.title}
            </p>
            <h3 className="mt-1 font-black">{lane.subtitle}</h3>
          </div>
        </div>
        <Badge tone={lane.isActive ? 'success' : lane.statusLabel === 'Terminé' ? 'success' : 'warning'}>
          {lane.isActive ? lane.statusLabel : 'En attente'}
        </Badge>
      </div>

      {lane.isActive ? (
        <div className="rounded-2xl border border-brand-300 bg-white/80 p-4 dark:border-brand-700 dark:bg-slate-950/50">
          <p className="flex items-center gap-2 text-sm font-black text-brand-800 dark:text-brand-200">
            <FiArrowRight className="shrink-0" />
            Votre prochaine action
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{lane.instruction}</p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">{lane.instruction}</p>
      )}

      {lane.completedSteps.length ? (
        <ul className="grid gap-2">
          {lane.completedSteps.map((step) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)]"
            >
              <FiCheck className="shrink-0 text-emerald-600" />
              {step}
            </li>
          ))}
        </ul>
      ) : null}

      {canOpenClaim ? (
        <div className="grid gap-3">
          <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
            Toutes les étapes sont complétées. En cas de problème, ouvrez une réclamation.
          </p>
          <Button variant="secondary" icon={FiFlag} onClick={onOpenClaim}>
            Ouvrir une réclamation
          </Button>
        </div>
      ) : isClient ? (
        <ClientActionSteps
          canCancel={canCancel}
          canDeclare={canDeclare}
          canDeclareReception={canDeclareReception}
          onCancel={onCancel}
          onDeclarePayment={onDeclarePayment}
          onProofSelected={onProofSelected}
          proof={proof}
          transfer={transfer}
        />
      ) : (
        <BusinessActionSteps
          businessProof={businessProof}
          canConfirmPaymentReception={canConfirmPaymentReception}
          canConfirmPayout={canConfirmPayout}
          onBusinessProofSelected={onBusinessProofSelected}
          onCompleteBusinessStep={onCompleteBusinessStep}
          transfer={transfer}
        />
      )}
    </Card>
  )
}

function ClientActionSteps({
  canCancel,
  canDeclare,
  canDeclareReception,
  onCancel,
  onDeclarePayment,
  onProofSelected,
  proof,
  transfer,
}) {
  return (
    <div className="grid gap-3">
      {canDeclare ? (
        <>
          <label className="grid cursor-pointer gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition hover:border-brand-300">
            <span className="flex items-center gap-2 text-sm font-bold">
              <FiUpload className="text-brand-700 dark:text-brand-300" />
              1. Ajouter la preuve de paiement
            </span>
            {proof ? (
              <ProofPreview proof={proof} />
            ) : (
              <span className="text-xs text-[var(--app-text-muted)]">
                Image ou PDF du virement effectué
              </span>
            )}
            <input className="sr-only" type="file" accept="image/*,.pdf" onChange={onProofSelected} />
          </label>
          <Button
            disabled={!proof || proof.uploading}
            loading={proof?.uploading}
            icon={FiCheckCircle}
            onClick={onDeclarePayment}
          >
            2. Déclarer le paiement
          </Button>
        </>
      ) : null}

      {transfer.paymentProof ? (
        <StoredProofCard label="Preuve de paiement envoyée" proof={transfer.paymentProof} />
      ) : null}

      {transfer.businessProof ? (
        <StoredProofCard
          label="Virement effectué par l’entreprise (preuve)"
          proof={transfer.businessProof}
        />
      ) : null}

      {transfer.receivedAt ? (
        <div className="rounded-2xl bg-emerald-50/70 p-4 text-sm dark:bg-emerald-950/20">
          <p className="font-black text-emerald-800 dark:text-emerald-300">Réception déclarée</p>
          <p className="mt-1">
            {transfer.receivedAmount} ({transfer.receivedMethod}) · {formatDate(transfer.receivedAt)}
          </p>
        </div>
      ) : null}

      {canDeclareReception ? (
        <Link to={`/transfers/${transfer.id}/receive`} state={{ transferView: 'client' }}>
          <Button icon={FiCheckCircle}>Déclarer la réception des fonds</Button>
        </Link>
      ) : null}

      {canCancel ? (
        <Button variant="danger" icon={FiXCircle} onClick={onCancel}>
          Annuler le transfert
        </Button>
      ) : null}
    </div>
  )
}

function BusinessActionSteps({
  businessProof,
  canConfirmPaymentReception,
  canConfirmPayout,
  onBusinessProofSelected,
  onCompleteBusinessStep,
  transfer,
}) {
  const step1Done = hasBusinessConfirmedReception(transfer)
  const step2Done = hasBusinessPayoutWithProof(transfer)
  const canSubmitPayout = Boolean(businessProof || transfer.businessProof)

  return (
    <div className="grid gap-4">
      <BusinessStepCard
        active={canConfirmPaymentReception}
        done={step1Done}
        locked={false}
        number={1}
        title="Confirmer la réception du paiement"
        description="Vérifiez que le paiement du client est bien arrivé sur votre compte."
      >
        {canConfirmPaymentReception ? (
          <Button
            icon={FiCheckCircle}
            onClick={() => onCompleteBusinessStep(TRANSFER_STATUS.RECEIVED)}
          >
            Confirmer la réception du paiement
          </Button>
        ) : null}
      </BusinessStepCard>

      <BusinessStepCard
        active={canConfirmPayout}
        done={step2Done}
        locked={!step1Done}
        number={2}
        title="Confirmer le transfert"
        description="Effectuez le virement vers le destinataire, ajoutez une preuve puis validez."
      >
        {step2Done && transfer.businessProof ? (
          <StoredProofCard label="Preuve de virement envoyée" proof={transfer.businessProof} />
        ) : null}

        {canConfirmPayout ? (
          <>
            <label className="grid cursor-pointer gap-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition hover:border-brand-300">
              <span className="flex items-center gap-2 text-sm font-bold">
                <FiUpload className="text-brand-700 dark:text-brand-300" />
                Preuve de transfert
              </span>
              {businessProof ? (
                <ProofPreview proof={{ file: businessProof, uploading: false }} />
              ) : (
                <span className="text-xs text-[var(--app-text-muted)]">
                  Image ou PDF du virement vers le destinataire (obligatoire)
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
              disabled={!canSubmitPayout}
              icon={FiCheckCircle}
              onClick={() => onCompleteBusinessStep(TRANSFER_STATUS.PAID_OUT)}
            >
              Confirmer le transfert
            </Button>
          </>
        ) : null}
      </BusinessStepCard>
    </div>
  )
}

function BusinessStepCard({ active, children, description, done, locked, number, title }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        done
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
          : active
            ? 'border-brand-300 bg-brand-50/40 dark:border-brand-700 dark:bg-brand-950/20'
            : locked
              ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 opacity-70'
              : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${
            done
              ? 'bg-emerald-600 text-white'
              : active
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
          }`}
        >
          {done ? <FiCheck /> : number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-black">{title}</p>
            {locked ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                <FiLock className="text-[9px]" />
                Après étape 1
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
          {children ? <div className="mt-4 grid gap-3">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}

function StoredProofCard({ label, proof }) {
  if (!proof?.name) return null
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <p className="font-black text-emerald-800 dark:text-emerald-300">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
        <FiFileText className="shrink-0 text-emerald-600" />
        <span className="truncate">{proof.name}</span>
        {proof.uploadedAt ? <span>· {formatDate(proof.uploadedAt)}</span> : null}
      </div>
    </div>
  )
}

function ProofPreview({ proof }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--app-surface)] p-3">
      {proof.file?.type?.startsWith('image/') ? (
        <img
          src={proof.url || URL.createObjectURL(proof.file)}
          alt={proof.file?.name}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiFileText />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs">{proof.file?.name}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">
          {proof.uploading ? 'Envoi...' : `${Math.ceil((proof.file?.size || 0) / 1024)} Ko`}
        </span>
      </span>
      <FiCheck className="shrink-0 text-emerald-600" />
    </div>
  )
}
